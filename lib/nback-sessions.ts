import { createClient } from "@/lib/supabase/client";
import type {
  NBackConfig,
  NBackTrialResult,
  SessionMetrics,
  SessionQualityFlag,
  SessionQualityFlagCode,
} from "@/games/types";

interface SubmitNBackSessionParams {
  submissionKey: string;
  config: NBackConfig;
  startedAt: string;
  completedAt: string;
  metrics: SessionMetrics;
  trials: NBackTrialResult[];
  gamePoints: number;
}

interface SavedNBackSession {
  sessionId: string;
  qualityFlags: SessionQualityFlag[];
}

function isQualityFlagCode(
  value: unknown
): value is SessionQualityFlagCode {
  return (
    value === "high_timeout_rate" ||
    value === "low_correct_response_count" ||
    value === "very_short_response" ||
    value === "long_session_duration"
  );
}

function parseQualityFlags(value: unknown): SessionQualityFlag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((flag) => {
    if (typeof flag !== "object" || flag === null) {
      return [];
    }

    const code = (flag as { code?: unknown }).code;

    return isQualityFlagCode(code) ? [{ code }] : [];
  });
}

export async function submitNBackSession({
  submissionKey,
  config,
  startedAt,
  completedAt,
  metrics,
  trials,
  gamePoints,
}: SubmitNBackSessionParams): Promise<SavedNBackSession> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_n_back_session", {
    p_session: {
      submissionKey,
      status: "completed",
      config,
      startedAt,
      completedAt,
      metrics,
      gamePoints,
    },
    p_trials: trials,
  });

  if (error) {
    throw new Error(`Unable to save this N-Back session: ${error.message}`);
  }

  if (typeof data !== "string") {
    throw new Error("The saved N-Back session did not return a session ID.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("cognitive_game_sessions")
    .select("quality_flags")
    .eq("id", data)
    .maybeSingle();

  if (sessionError) {
    console.warn(
      "The session saved, but its quality flags could not be loaded:",
      sessionError
    );
  }

  return {
    sessionId: data,
    qualityFlags: parseQualityFlags(session?.quality_flags),
  };
}
