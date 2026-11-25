-- N-Back non-target trials correctly require no response. Keep the stored
-- correct response nullable so future withholding-response tasks can retain
-- their scientific protocol semantics without a placeholder value.

alter table public.cognitive_game_trials
  alter column correct_response drop not null;
