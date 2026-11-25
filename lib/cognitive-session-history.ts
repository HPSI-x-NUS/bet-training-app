import type {
  SessionQualityFlag,
  SessionQualityFlagCode,
} from "@/games/types";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface StroopSessionHistoryItem {
  id: string;
  completedAt: string;
  configVersion: string | null;
  config: unknown;
  totalTrials: number | null;
  correctTrials: number | null;
  accuracy: number | null;
  meanReactionTimeMs: number | null;
  timeoutTrials: number | null;
  stroopInterferenceMs: number | null;
  gamePoints: number;
  qualityFlags: SessionQualityFlag[];
}

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
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
    if (!isJsonRecord(flag)) {
      return [];
    }

    return isQualityFlagCode(flag.code)
      ? [{ code: flag.code }]
      : [];
  });
}

export async function getStroopSessionHistory(): Promise<
  StroopSessionHistoryItem[]
> {
  const user = await requireRole("athlete");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cognitive_game_sessions")
    .select(
      "id, completed_at, config_version, config, metrics, game_points, quality_flags"
    )
    .eq("athlete_id", user.id)
    .eq("game_id", "stroop")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(
      `Unable to load your Stroop session history: ${error.message}`
    );
  }

  return data
    .filter((session) => session.completed_at !== null)
    .map((session) => {
      const metrics = isJsonRecord(session.metrics)
        ? session.metrics
        : {};

      const additionalMetrics = isJsonRecord(
        metrics.additionalMetrics
      )
        ? metrics.additionalMetrics
        : {};

      return {
        id: session.id,
        completedAt: session.completed_at,
        configVersion: session.config_version,
        config: session.config,
        totalTrials: getNumber(metrics.totalTrials),
        correctTrials: getNumber(metrics.correctTrials),
        accuracy: getNumber(metrics.accuracy),
        meanReactionTimeMs: getNumber(
          metrics.meanReactionTimeMs
        ),
        timeoutTrials: getNumber(
          additionalMetrics.timeoutTrials
        ),
        stroopInterferenceMs: getNumber(
          additionalMetrics.stroopInterferenceMs
        ),
        gamePoints: getNumber(session.game_points) ?? 0,
        qualityFlags: parseQualityFlags(
          session.quality_flags
        ),
      };
    });
}