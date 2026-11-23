import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface StroopSessionHistoryItem {
  id: string;
  completedAt: string;
  totalTrials: number | null;
  correctTrials: number | null;
  accuracy: number | null;
  meanReactionTimeMs: number | null;
  timeoutTrials: number | null;
  stroopInterferenceMs: number | null;
  gamePoints: number;
}

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getNumber(
  value: unknown
): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

export async function getStroopSessionHistory(): Promise<
  StroopSessionHistoryItem[]
> {
  const user = await requireRole("athlete");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cognitive_game_sessions")
    .select("id, completed_at, metrics, game_points")
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
        gamePoints:
          getNumber(session.game_points) ?? 0,
      };
    });
}