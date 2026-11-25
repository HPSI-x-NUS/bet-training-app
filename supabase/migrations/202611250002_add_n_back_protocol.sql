-- Adds the audited v1.0.0 three-minute visual-position 2-back protocol.

create or replace function public.submit_n_back_session(
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
  session_duration_ms double precision;
  session_game_points integer;
  trial jsonb;
  trial_index_value integer;
  trial_count integer;
  correct_count integer := 0;
  incorrect_count integer := 0;
  hit_count integer := 0;
  miss_count integer := 0;
  false_alarm_count integer := 0;
  correct_rejection_count integer := 0;
  very_short_response_count integer := 0;
  target_count_in_block integer := 0;
  trial_stimuli text[] := '{}';
  quality_flags_value jsonb := '[]'::jsonb;
begin
  if current_athlete_id is null then raise exception 'You must be signed in to save a training session.'; end if;
  if not exists (select 1 from public.profiles where id = current_athlete_id and role = 'athlete') then raise exception 'Only athlete accounts can save training sessions.'; end if;
  if jsonb_typeof(p_session) <> 'object' or jsonb_typeof(p_trials) <> 'array' then raise exception 'A valid N-Back session payload is required.'; end if;

  if nullif(p_session ->> 'submissionKey', '') is not null then
    submission_key_value := (p_session ->> 'submissionKey')::uuid;
    select id into saved_session_id from public.cognitive_game_sessions where athlete_id = current_athlete_id and submission_key = submission_key_value;
    if saved_session_id is not null then return saved_session_id; end if;
  end if;

  if p_session ->> 'status' <> 'completed' or p_session -> 'config' ->> 'gameId' <> 'n-back' then raise exception 'A completed N-Back session is required.'; end if;
  if p_session -> 'config' ->> 'configVersion' <> '1.0.0'
    or p_session -> 'config' ->> 'sessionMode' <> 'fixed-duration'
    or (p_session -> 'config' ->> 'sessionDurationMs')::integer <> 180000
    or (p_session -> 'config' ->> 'nLevel')::integer <> 2
    or (p_session -> 'config' ->> 'responseWindowMs')::integer <> 2000
    or (p_session -> 'config' ->> 'interTrialIntervalMs')::integer <> 500 then
    raise exception 'Unsupported N-Back protocol configuration.';
  end if;
  if p_session ->> 'startedAt' is null or p_session ->> 'completedAt' is null or jsonb_typeof(p_session -> 'metrics') <> 'object' then raise exception 'N-Back timestamps and metrics are required.'; end if;
  if coalesce(p_session ->> 'gamePoints', '') !~ '^[0-9]+$' then raise exception 'Game points must be a non-negative whole number.'; end if;

  session_started_at := (p_session ->> 'startedAt')::timestamptz;
  session_completed_at := (p_session ->> 'completedAt')::timestamptz;
  session_duration_ms := extract(epoch from (session_completed_at - session_started_at)) * 1000;
  session_game_points := (p_session ->> 'gamePoints')::integer;
  if session_duration_ms < 175000 then raise exception 'The timed N-Back session ended too early.'; end if;
  trial_count := jsonb_array_length(p_trials);
  if trial_count < 1 or trial_count > 100 then raise exception 'The N-Back trial count is invalid.'; end if;

  for trial in select value from jsonb_array_elements(p_trials) loop
    if trial ->> 'gameId' <> 'n-back' or jsonb_typeof(trial -> 'trialIndex') <> 'number' then raise exception 'A trial contains invalid N-Back result data.'; end if;
    trial_index_value := (trial ->> 'trialIndex')::integer;
    if trial_index_value <> array_length(trial_stimuli, 1) then raise exception 'N-Back trial indices must be sequential.'; end if;
    if trial ->> 'stimulus' not in ('top-left','top-centre','top-right','middle-left','centre','middle-right','bottom-left','bottom-centre','bottom-right') then raise exception 'A trial has an invalid position.'; end if;

    if trial_index_value < 2 then
      if (trial ->> 'isTarget')::boolean or trial ->> 'comparisonStimulus' is not null then raise exception 'Setup trials cannot be targets.'; end if;
    elsif trial ->> 'comparisonStimulus' <> trial_stimuli[trial_index_value - 1]
      or ((trial ->> 'stimulus' = trial_stimuli[trial_index_value - 1]) <> (trial ->> 'isTarget')::boolean) then
      raise exception 'N-Back comparisons must match the stimulus two trials earlier.';
    end if;

    if (trial ->> 'isTarget')::boolean then
      target_count_in_block := target_count_in_block + 1;
      if trial ->> 'correctResponse' <> 'match' then raise exception 'Target trials require the match response.'; end if;
    elsif trial ->> 'correctResponse' is not null then raise exception 'Non-target trials cannot require a response.'; end if;

    if trial ->> 'response' is null then
      if trial ->> 'reactionTimeMs' is not null or trial ->> 'responseTimestampMs' is not null then raise exception 'Unanswered trials cannot contain response timing.'; end if;
    elsif trial ->> 'response' <> 'match' or jsonb_typeof(trial -> 'reactionTimeMs') <> 'number' or (trial ->> 'reactionTimeMs')::double precision < 0 or (trial ->> 'reactionTimeMs')::double precision >= 2000 then
      raise exception 'Answered N-Back trials must contain valid match timing.';
    elsif (trial ->> 'reactionTimeMs')::double precision < 100 then
      very_short_response_count := very_short_response_count + 1;
    end if;

    if (trial ->> 'isTarget')::boolean and trial ->> 'response' = 'match' then hit_count := hit_count + 1;
    elsif (trial ->> 'isTarget')::boolean then miss_count := miss_count + 1;
    elsif trial ->> 'response' = 'match' then false_alarm_count := false_alarm_count + 1;
    else correct_rejection_count := correct_rejection_count + 1;
    end if;

    if (trial_index_value >= 2 and (trial_index_value - 1) % 6 = 0) then
      if target_count_in_block <> 2 then raise exception 'Each complete N-Back target block requires two targets.'; end if;
      target_count_in_block := 0;
    end if;
    trial_stimuli := array_append(trial_stimuli, trial ->> 'stimulus');
  end loop;

  correct_count := hit_count + correct_rejection_count;
  incorrect_count := miss_count + false_alarm_count;
  if (p_session -> 'metrics' ->> 'totalTrials')::integer <> trial_count
    or (p_session -> 'metrics' ->> 'correctTrials')::integer <> correct_count
    or (p_session -> 'metrics' ->> 'incorrectTrials')::integer <> incorrect_count
    or (p_session -> 'metrics' -> 'additionalMetrics' ->> 'hits')::integer <> hit_count
    or (p_session -> 'metrics' -> 'additionalMetrics' ->> 'misses')::integer <> miss_count
    or (p_session -> 'metrics' -> 'additionalMetrics' ->> 'falseAlarms')::integer <> false_alarm_count
    or (p_session -> 'metrics' -> 'additionalMetrics' ->> 'correctRejections')::integer <> correct_rejection_count
    or session_game_points <> correct_count * 10 then raise exception 'N-Back metrics do not agree with submitted trials.'; end if;

  if very_short_response_count > 0 then quality_flags_value := quality_flags_value || jsonb_build_array(jsonb_build_object('code','very_short_response','trialCount',very_short_response_count,'thresholdMs',100)); end if;
  if session_duration_ms > 185000 then quality_flags_value := quality_flags_value || jsonb_build_array(jsonb_build_object('code','long_session_duration','durationMs',round(session_duration_ms)::integer,'thresholdMs',185000)); end if;

  insert into public.cognitive_game_sessions (id,athlete_id,submission_key,game_id,config_version,config,status,started_at,completed_at,metrics,game_points,quality_flags)
  values (new_session_id,current_athlete_id,submission_key_value,'n-back','1.0.0',p_session -> 'config','completed',session_started_at,session_completed_at,p_session -> 'metrics',session_game_points,quality_flags_value)
  on conflict (athlete_id,submission_key) where submission_key is not null do nothing returning id into saved_session_id;
  if saved_session_id is null then select id into saved_session_id from public.cognitive_game_sessions where athlete_id=current_athlete_id and submission_key=submission_key_value; return saved_session_id; end if;
  insert into public.cognitive_game_trials (session_id,trial_index,condition,stimulus,selected_response,correct_response,is_correct,reaction_time_ms,stimulus_onset_ms,response_timestamp_ms)
  select saved_session_id,(value ->> 'trialIndex')::integer,case when (value ->> 'isTarget')::boolean then 'target' else 'non-target' end,jsonb_build_object('position',value ->> 'stimulus','comparisonPosition',value ->> 'comparisonStimulus'),value ->> 'response',value ->> 'correctResponse',(value ->> 'isCorrect')::boolean,case when value ->> 'reactionTimeMs' is null then null else (value ->> 'reactionTimeMs')::double precision end,(value ->> 'stimulusOnsetMs')::double precision,case when value ->> 'responseTimestampMs' is null then null else (value ->> 'responseTimestampMs')::double precision end from jsonb_array_elements(p_trials);
  return saved_session_id;
end;
$function$;
