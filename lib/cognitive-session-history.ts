import type {
  GameId,
  SessionQualityFlag,
  SessionQualityFlagCode,
} from "@/games/types";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Context shared by every completed cognitive task.
 *
 * Task-specific scientific measures deliberately stay in each game's
 * history item instead of becoming cross-task fields.
 */
export interface CognitiveSessionHistoryContext {
  id: string;
  gameId: GameId;
  completedAt: string;
  configVersion: string | null;
  config: unknown;
  gamePoints: number;
  qualityFlags: SessionQualityFlag[];
}

/**
 * Stroop's scientific measures. Future tasks receive separate adapters
 * and history types, rather than repurposing these properties.
 */
export interface StroopSessionHistoryItem
  extends CognitiveSessionHistoryContext {
  gameId: "stroop";
  totalTrials: number | null;
  correctTrials: number | null;
  accuracy: number | null;
  meanReactionTimeMs: number | null;
  timeoutTrials: number | null;
  stroopInterferenceMs: number | null;
}

type JsonRecord = Record<string, unknown>;

export interface CognitiveSessionHistoryRow {
  id: unknown;
  game_id: unknown;
  completed_at: unknown;
  config_version: unknown;
  config: unknown;
  metrics: unknown;
  game_points: unknown;
  quality_flags: unknown;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function isGameId(value: unknown): value is GameId {
  return (
    value === "stroop" ||
    value === "n-back" ||
    value === "flanker" ||
    value === "go-no-go"
  );
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

export function getCognitiveSessionHistoryContext(
  session: CognitiveSessionHistoryRow
): CognitiveSessionHistoryContext | null {
  if (
    typeof session.id !== "string" ||
    !isGameId(session.game_id) ||
    typeof session.completed_at !== "string"
  ) {
    return null;
  }

  return {
    id: session.id,
    gameId: session.game_id,
    completedAt: session.completed_at,
    configVersion:
      typeof session.config_version === "string"
        ? session.config_version
        : null,
    config: session.config,
    gamePoints: getNumber(session.game_points) ?? 0,
    qualityFlags: parseQualityFlags(session.quality_flags),
  };
}

/**
 * Convert a completed database row to Stroop-only history data.
 * Returns null for incomplete, malformed, or non-Stroop rows.
 */
export function toStroopSessionHistoryItem(
  session: CognitiveSessionHistoryRow
): StroopSessionHistoryItem | null {
  const context = getCognitiveSessionHistoryContext(session);

  if (context?.gameId !== "stroop") {
    return null;
  }

  const metrics = isJsonRecord(session.metrics)
    ? session.metrics
    : {};

  const additionalMetrics = isJsonRecord(
    metrics.additionalMetrics
  )
    ? metrics.additionalMetrics
    : {};

  return {
    ...context,
    gameId: "stroop",
    totalTrials: getNumber(metrics.totalTrials),
    correctTrials: getNumber(metrics.correctTrials),
    accuracy: getNumber(metrics.accuracy),
    meanReactionTimeMs: getNumber(metrics.meanReactionTimeMs),
    timeoutTrials: getNumber(additionalMetrics.timeoutTrials),
    stroopInterferenceMs: getNumber(
      additionalMetrics.stroopInterferenceMs
    ),
  };
}

/**
 * Shared database boundary for per-game history adapters.
 * The caller chooses the game, while the adapter owns the scientific data.
 */
export async function getCompletedCognitiveSessionRows(
  gameId: GameId
): Promise<CognitiveSessionHistoryRow[]> {
  const user = await requireRole("athlete");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cognitive_game_sessions")
    .select(
      "id, game_id, completed_at, config_version, config, metrics, game_points, quality_flags"
    )
    .eq("athlete_id", user.id)
    .eq("game_id", gameId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(
      `Unable to load your ${gameId} session history: ${error.message}`
    );
  }

  return data;
}

export async function getStroopSessionHistory(): Promise<
  StroopSessionHistoryItem[]
> {
  const sessions = await getCompletedCognitiveSessionRows("stroop");

  return sessions.flatMap((session) => {
    const historyItem = toStroopSessionHistoryItem(session);

    return historyItem === null ? [] : [historyItem];
  });
}
