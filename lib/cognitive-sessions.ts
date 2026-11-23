import { createClient } from "@/lib/supabase/client";
import type {
  SessionMetrics,
  StroopConfig,
  StroopTrialResult,
} from "@/games/types";

interface SubmitStroopSessionParams {
  config: StroopConfig;
  startedAt: string;
  completedAt: string;
  metrics: SessionMetrics;
  trials: StroopTrialResult[];
  gamePoints: number;
}

export async function submitStroopSession({
  config,
  startedAt,
  completedAt,
  metrics,
  trials,
  gamePoints,
}: SubmitStroopSessionParams): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "submit_stroop_session",
    {
      p_session: {
        status: "completed",
        config,
        startedAt,
        completedAt,
        metrics,
        gamePoints,
      },
      p_trials: trials,
    }
  );

  if (error) {
    throw new Error(
      `Unable to save this Stroop session: ${error.message}`
    );
  }

  if (typeof data !== "string") {
    throw new Error(
      "The saved Stroop session did not return a session ID."
    );
  }

  return data;
}