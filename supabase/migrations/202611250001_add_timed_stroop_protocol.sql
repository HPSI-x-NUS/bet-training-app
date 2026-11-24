-- Adds the audited v2.0.0 three-minute Stroop protocol while preserving v1.0.0.

create or replace function public.submit_stroop_session(
  p_session jsonb,
  p_trials jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  current_athlete_id uuid := auth.uid();
  new_session_id uuid := gen_random_uuid();
  saved_session_id uuid;
  submission_key_value uuid;
  session_started_at timestamptz;
  session_completed_at timestamptz;
  session_game_points integer;
  session_duration_ms double precision;
  protocol_version text;
  expected_trials integer;
  long_duration_threshold_ms integer;
  trial jsonb;
  trial_index_value integer;
  seen_indices integer[] := '{}';
  trial_count integer;
  correct_count integer := 0;
  incorrect_count integer := 0;
  timeout_count integer := 0;
  very_short_response_count integer := 0;
  quality_flags_value jsonb := '[]'::jsonb;
begin
  if current_athlete_id is null then raise exception 'You must be signed in to save a training session.'; end if;
  if not exists (select 1 from public.profiles where id = current_athlete_id and role = 'athlete') then raise exception 'Only athlete accounts can save training sessions.'; end if;
  if jsonb_typeof(p_session) <> 'object' then raise exception 'The session payload must be an object.'; end if;

  if nullif(p_session ->> 'submissionKey', '') is not null then
    submission_key_value := (p_session ->> 'submissionKey')::uuid;
    select id into saved_session_id from public.cognitive_game_sessions where athlete_id = current_athlete_id and submission_key = submission_key_value;
    if saved_session_id is not null then return saved_session_id; end if;
  end if;

  if p_session ->> 'status' <> 'completed' then raise exception 'Only completed Stroop sessions can be submitted.'; end if;
  if p_session -> 'config' is null or jsonb_typeof(p_session -> 'config') <> 'object' or p_session -> 'config' ->> 'gameId' <> 'stroop' then raise exception 'A valid Stroop configuration is required.'; end if;
  protocol_version := p_session -> 'config' ->> 'configVersion';
  if protocol_version = '1.0.0' then
    expected_trials := 40; long_duration_threshold_ms := 180000;
  elsif protocol_version = '2.0.0'
    and p_session -> 'config' ->> 'sessionMode' = 'fixed-duration'
    and (p_session -> 'config' ->> 'sessionDurationMs')::integer = 180000 then
    expected_trials := null; long_duration_threshold_ms := 185000;
  else
    raise exception 'Unsupported Stroop protocol configuration.';
  end if;
  if jsonb_typeof(p_session -> 'metrics') <> 'object' then raise exception 'A metrics object is required.'; end if;
  if p_session ->> 'startedAt' is null or p_session ->> 'completedAt' is null then raise exception 'Session timestamps are required.'; end if;
  if coalesce(p_session ->> 'gamePoints', '') !~ '^[0-9]+$' then raise exception 'Game points must be a non-negative whole number.'; end if;
  session_started_at := (p_session ->> 'startedAt')::timestamptz;
  session_completed_at := (p_session ->> 'completedAt')::timestamptz;
  session_game_points := (p_session ->> 'gamePoints')::integer;
  session_duration_ms := extract(epoch from (session_completed_at - session_started_at)) * 1000;
  if session_completed_at < session_started_at then raise exception 'The completion timestamp cannot precede the start timestamp.'; end if;
  if jsonb_typeof(p_trials) <> 'array' then raise exception 'Trials must be an array.'; end if;
  trial_count := jsonb_array_length(p_trials);
  if (expected_trials is not null and trial_count <> expected_trials) or (expected_trials is null and (trial_count < 1 or trial_count > 400)) then raise exception 'The submitted trial count does not match the protocol.'; end if;

  for trial in select value from jsonb_array_elements(p_trials) loop
    if trial ->> 'gameId' <> 'stroop' or jsonb_typeof(trial -> 'trialIndex') <> 'number' or (trial ->> 'trialIndex') !~ '^[0-9]+$' then raise exception 'A trial contains invalid Stroop result data.'; end if;
    trial_index_value := (trial ->> 'trialIndex')::integer;
    if trial_index_value <> array_length(seen_indices, 1) or trial_index_value = any(seen_indices) then raise exception 'Trial indices must be sequential and unique.'; end if;
    seen_indices := array_append(seen_indices, trial_index_value);
    if trial ->> 'word' not in ('red','blue','green','yellow') or trial ->> 'inkColor' not in ('red','blue','green','yellow') or trial ->> 'congruency' not in ('congruent','incongruent') or trial ->> 'correctResponse' <> trial ->> 'inkColor' or jsonb_typeof(trial -> 'isCorrect') <> 'boolean' or jsonb_typeof(trial -> 'stimulusOnsetMs') <> 'number' then raise exception 'A trial contains invalid Stroop result data.'; end if;
    if ((trial ->> 'word' = trial ->> 'inkColor') <> (trial ->> 'congruency' = 'congruent')) then raise exception 'A trial congruency value must match its word and ink colour.'; end if;
    if trial ->> 'response' is null then
      if trial ->> 'reactionTimeMs' is not null or trial ->> 'responseTimestampMs' is not null or (trial ->> 'isCorrect')::boolean then raise exception 'Timeout trials must not contain a response, timing, or correct result.'; end if;
      timeout_count := timeout_count + 1;
    else
      if trial ->> 'response' not in ('red','blue','green','yellow') or jsonb_typeof(trial -> 'reactionTimeMs') <> 'number' or jsonb_typeof(trial -> 'responseTimestampMs') <> 'number' or (trial ->> 'reactionTimeMs')::double precision < 0 or (trial ->> 'reactionTimeMs')::double precision >= 2000 then raise exception 'Answered trials must contain valid timing.'; end if;
      if abs(((trial ->> 'responseTimestampMs')::double precision - (trial ->> 'stimulusOnsetMs')::double precision) - (trial ->> 'reactionTimeMs')::double precision) > 0.001 then raise exception 'A trial reaction time must match its recorded timestamps.'; end if;
      if (trial ->> 'isCorrect')::boolean <> (trial ->> 'response' = trial ->> 'correctResponse') then raise exception 'A trial correctness value must match its response.'; end if;
      if (trial ->> 'reactionTimeMs')::double precision < 100 then very_short_response_count := very_short_response_count + 1; end if;
      if (trial ->> 'isCorrect')::boolean then correct_count := correct_count + 1; else incorrect_count := incorrect_count + 1; end if;
    end if;
  end loop;
  if (p_session -> 'metrics' ->> 'totalTrials')::integer <> trial_count or (p_session -> 'metrics' ->> 'correctTrials')::integer <> correct_count or (p_session -> 'metrics' ->> 'incorrectTrials')::integer <> incorrect_count or (p_session -> 'metrics' -> 'additionalMetrics' ->> 'timeoutTrials')::integer <> timeout_count then raise exception 'Session metrics do not agree with the submitted trial results.'; end if;
  if timeout_count::numeric / trial_count >= 0.2 then quality_flags_value := quality_flags_value || jsonb_build_array(jsonb_build_object('code','high_timeout_rate','timeoutTrials',timeout_count,'totalTrials',trial_count)); end if;
  if correct_count < 5 then quality_flags_value := quality_flags_value || jsonb_build_array(jsonb_build_object('code','low_correct_response_count','correctTrials',correct_count)); end if;
  if very_short_response_count > 0 then quality_flags_value := quality_flags_value || jsonb_build_array(jsonb_build_object('code','very_short_response','trialCount',very_short_response_count,'thresholdMs',100)); end if;
  if session_duration_ms > long_duration_threshold_ms then quality_flags_value := quality_flags_value || jsonb_build_array(jsonb_build_object('code','long_session_duration','durationMs',round(session_duration_ms)::integer,'thresholdMs',long_duration_threshold_ms)); end if;
  insert into public.cognitive_game_sessions (id,athlete_id,submission_key,game_id,config_version,config,status,started_at,completed_at,metrics,game_points,quality_flags)
  values (new_session_id,current_athlete_id,submission_key_value,'stroop',protocol_version,p_session -> 'config','completed',session_started_at,session_completed_at,p_session -> 'metrics',session_game_points,quality_flags_value)
  on conflict (athlete_id,submission_key) where submission_key is not null do nothing returning id into saved_session_id;
  if saved_session_id is null then select id into saved_session_id from public.cognitive_game_sessions where athlete_id=current_athlete_id and submission_key=submission_key_value; return saved_session_id; end if;
  insert into public.cognitive_game_trials (session_id,trial_index,condition,stimulus,selected_response,correct_response,is_correct,reaction_time_ms,stimulus_onset_ms,response_timestamp_ms)
  select saved_session_id,(value ->> 'trialIndex')::integer,value ->> 'congruency',jsonb_build_object('word',value ->> 'word','inkColor',value ->> 'inkColor'),value ->> 'response',value ->> 'correctResponse',(value ->> 'isCorrect')::boolean,case when value ->> 'reactionTimeMs' is null then null else (value ->> 'reactionTimeMs')::double precision end,(value ->> 'stimulusOnsetMs')::double precision,case when value ->> 'responseTimestampMs' is null then null else (value ->> 'responseTimestampMs')::double precision end from jsonb_array_elements(p_trials);
  return saved_session_id;
end;
$function$;
