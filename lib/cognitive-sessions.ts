import { createClient } from "@/lib/supabase/client";
import type {
  SessionMetrics,
  SessionQualityFlag,
  SessionQualityFlagCode,
  StroopConfig,
  StroopTrialResult,
} from "@/games/types";

interface SubmitStroopSessionParams {
  submissionKey: string;
  config: StroopConfig;
  startedAt: string;
  completedAt: string;
  metrics: SessionMetrics;
  trials: StroopTrialResult[];
  gamePoints: number;
}

interface SavedStroopSession {
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

function parseQualityFlags(
  value: unknown
): SessionQualityFlag[] {
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

export async function submitStroopSession({
  submissionKey,
  config,
  startedAt,
  completedAt,
  metrics,
  trials,
  gamePoints,
}: SubmitStroopSessionParams): Promise<SavedStroopSession> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "submit_stroop_session",
    {
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

  const { data: session, error: sessionError } =
    await supabase
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
