-- Stroop timeouts remain unanswered and incorrect, while N-Back non-target
-- trials can be unanswered and correctly classified as correct rejections.
-- Both cases require absent response timing.

alter table public.cognitive_game_trials
  drop constraint response_and_timing_consistency;

alter table public.cognitive_game_trials
  add constraint response_and_timing_consistency
  check (
    (
      selected_response is null
      and reaction_time_ms is null
      and response_timestamp_ms is null
    )
    or (
      selected_response is not null
      and reaction_time_ms is not null
      and response_timestamp_ms is not null
    )
  );
