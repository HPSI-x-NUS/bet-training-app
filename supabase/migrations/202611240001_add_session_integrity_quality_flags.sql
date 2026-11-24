-- Session Integrity and Quality Flags
--
-- Adds a retry-safe submission key for new sessions and transparent,
-- non-clinical quality flags. Raw trial values are never changed.

alter table public.cognitive_game_sessions
  add column if not exists submission_key uuid;

alter table public.cognitive_game_sessions
  add column if not exists quality_flags jsonb
  not null
  default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cognitive_game_sessions_quality_flags_check'
      and conrelid = 'public.cognitive_game_sessions'::regclass
  ) then
    alter table public.cognitive_game_sessions
      add constraint cognitive_game_sessions_quality_flags_check
      check (jsonb_typeof(quality_flags) = 'array');
  end if;
end;
$$;

-- Existing historical sessions intentionally remain without a submission key.
-- New app versions will provide one key per training attempt.
create unique index if not exists
  cognitive_game_sessions_athlete_submission_key_unique
on public.cognitive_game_sessions (athlete_id, submission_key)
where submission_key is not null;

comment on column public.cognitive_game_sessions.submission_key is
  'Client-generated UUID used to make retries of one training attempt idempotent.';

comment on column public.cognitive_game_sessions.quality_flags is
  'Transparent, non-clinical data-quality notes. These never change raw trials, cognitive metrics, points, XP, streaks, or goals.';

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

  trial jsonb;
  trial_index_value integer;
  seen_indices boolean[] := array_fill(false, array[40]);

  correct_count integer := 0;
  incorrect_count integer := 0;
  timeout_count integer := 0;
  very_short_response_count integer := 0;

  quality_flags_value jsonb := '[]'::jsonb;
begin
  -- Only authenticated athlete accounts may submit results.
  if current_athlete_id is null then
    raise exception 'You must be signed in to save a training session.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_athlete_id
      and role = 'athlete'
  ) then
    raise exception 'Only athlete accounts can save training sessions.';
  end if;

  if jsonb_typeof(p_session) <> 'object' then
    raise exception 'The session payload must be an object.';
  end if;

  -- Old app versions may omit this during rollout.
  -- New app versions always send a UUID for safe retry behaviour.
  if nullif(p_session ->> 'submissionKey', '') is not null then
    submission_key_value :=
      (p_session ->> 'submissionKey')::uuid;

    -- A same-athlete retry returns the original session immediately.
    if exists (
      select 1
      from public.cognitive_game_sessions
      where athlete_id = current_athlete_id
        and submission_key = submission_key_value
    ) then
      select id
      into saved_session_id
      from public.cognitive_game_sessions
      where athlete_id = current_athlete_id
        and submission_key = submission_key_value;

      return saved_session_id;
    end if;
  end if;

  if p_session ->> 'status' <> 'completed' then
    raise exception 'Only completed Stroop sessions can be submitted.';
  end if;

  if p_session -> 'config' is null
    or jsonb_typeof(p_session -> 'config') <> 'object'
    or p_session -> 'config' ->> 'gameId' <> 'stroop'
    or coalesce(p_session -> 'config' ->> 'configVersion', '') = '' then
    raise exception
      'A valid Stroop configuration and configuration version are required.';
  end if;

  if p_session -> 'metrics' is null
    or jsonb_typeof(p_session -> 'metrics') <> 'object' then
    raise exception 'A metrics object is required.';
  end if;

  if p_session ->> 'startedAt' is null
    or p_session ->> 'completedAt' is null then
    raise exception
      'Session start and completion timestamps are required.';
  end if;

  if coalesce(p_session ->> 'gamePoints', '') !~ '^[0-9]+$' then
    raise exception 'Game points must be a non-negative whole number.';
  end if;

  session_started_at := (p_session ->> 'startedAt')::timestamptz;
  session_completed_at := (p_session ->> 'completedAt')::timestamptz;
  session_game_points := (p_session ->> 'gamePoints')::integer;
  session_duration_ms :=
    extract(epoch from (session_completed_at - session_started_at)) * 1000;

  if session_completed_at < session_started_at then
    raise exception
      'The completion timestamp cannot precede the start timestamp.';
  end if;

  if jsonb_typeof(p_trials) <> 'array'
    or jsonb_array_length(p_trials) <> 40 then
    raise exception
      'A completed Stroop session must contain exactly 40 trials.';
  end if;

  for trial in
    select value
    from jsonb_array_elements(p_trials)
  loop
    if trial ->> 'gameId' <> 'stroop' then
      raise exception 'Every submitted trial must be a Stroop trial.';
    end if;

    if jsonb_typeof(trial -> 'trialIndex') <> 'number'
      or (trial ->> 'trialIndex') !~ '^[0-9]+$' then
      raise exception
        'Every trial must have a whole-number trial index.';
    end if;

    trial_index_value := (trial ->> 'trialIndex')::integer;

    if trial_index_value < 0
      or trial_index_value >= 40
      or seen_indices[trial_index_value + 1] then
      raise exception
        'Trial indices must be unique and range from 0 to 39.';
    end if;

    seen_indices[trial_index_value + 1] := true;

    if trial ->> 'word' not in ('red', 'blue', 'green', 'yellow')
      or trial ->> 'inkColor' not in ('red', 'blue', 'green', 'yellow')
      or trial ->> 'congruency' not in ('congruent', 'incongruent')
      or trial ->> 'correctResponse' not in ('red', 'blue', 'green', 'yellow')
      or jsonb_typeof(trial -> 'isCorrect') <> 'boolean'
      or jsonb_typeof(trial -> 'stimulusOnsetMs') <> 'number' then
      raise exception 'A trial contains invalid Stroop result data.';
    end if;

    if trial ->> 'correctResponse' <> trial ->> 'inkColor' then
      raise exception
        'A trial correct response must match its ink colour.';
    end if;

    if (
      (trial ->> 'word' = trial ->> 'inkColor')
      <> (trial ->> 'congruency' = 'congruent')
    ) then
      raise exception
        'A trial congruency value must match its word and ink colour.';
    end if;

    if trial ->> 'response' is null then
      if trial ->> 'reactionTimeMs' is not null
        or trial ->> 'responseTimestampMs' is not null
        or (trial ->> 'isCorrect')::boolean then
        raise exception
          'Timeout trials must not contain a response, timing, or correct result.';
      end if;

      timeout_count := timeout_count + 1;
    else
      if trial ->> 'response' not in ('red', 'blue', 'green', 'yellow')
        or jsonb_typeof(trial -> 'reactionTimeMs') <> 'number'
        or jsonb_typeof(trial -> 'responseTimestampMs') <> 'number'
        or (trial ->> 'reactionTimeMs')::double precision < 0
        or (trial ->> 'reactionTimeMs')::double precision >= 2000 then
        raise exception
          'Answered trials must contain a valid response within the response window.';
      end if;

      if abs(
        (
          (trial ->> 'responseTimestampMs')::double precision
          - (trial ->> 'stimulusOnsetMs')::double precision
        )
        - (trial ->> 'reactionTimeMs')::double precision
      ) > 0.001 then
        raise exception
          'A trial reaction time must match its recorded timestamps.';
      end if;

      if (trial ->> 'isCorrect')::boolean
        <> (trial ->> 'response' = trial ->> 'correctResponse') then
        raise exception
          'A trial correctness value must match its response.';
      end if;

      if (trial ->> 'reactionTimeMs')::double precision < 100 then
        very_short_response_count := very_short_response_count + 1;
      end if;

      if (trial ->> 'isCorrect')::boolean then
        correct_count := correct_count + 1;
      else
        incorrect_count := incorrect_count + 1;
      end if;
    end if;
  end loop;

  if (p_session -> 'metrics' ->> 'totalTrials')::integer <> 40
    or (p_session -> 'metrics' ->> 'correctTrials')::integer <> correct_count
    or (p_session -> 'metrics' ->> 'incorrectTrials')::integer <> incorrect_count
    or (
      p_session -> 'metrics' -> 'additionalMetrics' ->> 'timeoutTrials'
    )::integer <> timeout_count then
    raise exception
      'Session metrics do not agree with the submitted trial results.';
  end if;

  -- Quality flags describe interpretation context only.
  -- They do not modify the submitted data or affect gamification.
  if timeout_count >= 8 then
    quality_flags_value := quality_flags_value || jsonb_build_array(
      jsonb_build_object(
        'code', 'high_timeout_rate',
        'timeoutTrials', timeout_count,
        'totalTrials', 40
      )
    );
  end if;

  if correct_count < 5 then
    quality_flags_value := quality_flags_value || jsonb_build_array(
      jsonb_build_object(
        'code', 'low_correct_response_count',
        'correctTrials', correct_count
      )
    );
  end if;

  if very_short_response_count > 0 then
    quality_flags_value := quality_flags_value || jsonb_build_array(
      jsonb_build_object(
        'code', 'very_short_response',
        'trialCount', very_short_response_count,
        'thresholdMs', 100
      )
    );
  end if;

  if session_duration_ms > 180000 then
    quality_flags_value := quality_flags_value || jsonb_build_array(
      jsonb_build_object(
        'code', 'long_session_duration',
        'durationMs', round(session_duration_ms)::integer,
        'thresholdMs', 180000
      )
    );
  end if;

  insert into public.cognitive_game_sessions (
    id,
    athlete_id,
    submission_key,
    game_id,
    config_version,
    config,
    status,
    started_at,
    completed_at,
    metrics,
    game_points,
    quality_flags
  )
  values (
    new_session_id,
    current_athlete_id,
    submission_key_value,
    'stroop',
    p_session -> 'config' ->> 'configVersion',
    p_session -> 'config',
    'completed',
    session_started_at,
    session_completed_at,
    p_session -> 'metrics',
    session_game_points,
    quality_flags_value
  )
  on conflict (athlete_id, submission_key)
    where submission_key is not null
  do nothing
  returning id into saved_session_id;

  -- Covers a simultaneous retry that won the insert race.
  if saved_session_id is null then
    select id
    into saved_session_id
    from public.cognitive_game_sessions
    where athlete_id = current_athlete_id
      and submission_key = submission_key_value;

    if saved_session_id is null then
      raise exception 'Unable to save this Stroop session.';
    end if;

    return saved_session_id;
  end if;

  insert into public.cognitive_game_trials (
    session_id,
    trial_index,
    condition,
    stimulus,
    selected_response,
    correct_response,
    is_correct,
    reaction_time_ms,
    stimulus_onset_ms,
    response_timestamp_ms
  )
  select
    saved_session_id,
    (value ->> 'trialIndex')::integer,
    value ->> 'congruency',
    jsonb_build_object(
      'word', value ->> 'word',
      'inkColor', value ->> 'inkColor'
    ),
    value ->> 'response',
    value ->> 'correctResponse',
    (value ->> 'isCorrect')::boolean,
    case
      when value ->> 'reactionTimeMs' is null then null
      else (value ->> 'reactionTimeMs')::double precision
    end,
    (value ->> 'stimulusOnsetMs')::double precision,
    case
      when value ->> 'responseTimestampMs' is null then null
      else (value ->> 'responseTimestampMs')::double precision
    end
  from jsonb_array_elements(p_trials);

  return saved_session_id;
end;
$function$;