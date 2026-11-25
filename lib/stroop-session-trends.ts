import type {
  StroopSessionHistoryItem,
} from "@/lib/cognitive-session-history";

export type StroopProtocolFilter =
  | "all"
  | "1.0.0"
  | "2.0.0";

export type StroopTrendMetric =
  | "accuracy"
  | "meanReactionTimeMs"
  | "stroopInterferenceMs";

export interface StroopTrendPoint {
  id: string;
  completedAt: string;
  value: number;
  hasQualityFlags: boolean;
}

export interface StroopTrendSummary {
  change: number;
  displayValue: string;
  tone: "good" | "bad" | "neutral";
}

function getMetricValue(
  session: StroopSessionHistoryItem,
  metric: StroopTrendMetric
) {
  return session[metric];
}

export function filterStroopSessions(
  sessions: StroopSessionHistoryItem[],
  protocol: StroopProtocolFilter
) {
  if (protocol === "all") {
    return sessions;
  }

  return sessions.filter(
    (session) => session.configVersion === protocol
  );
}

export function getStroopTrendPoints(
  sessions: StroopSessionHistoryItem[],
  protocol: Exclude<StroopProtocolFilter, "all">,
  metric: StroopTrendMetric
): StroopTrendPoint[] {
  return filterStroopSessions(sessions, protocol)
    .flatMap((session) => {
      const value = getMetricValue(session, metric);

      if (value === null || !Number.isFinite(value)) {
        return [];
      }

      return [
        {
          id: session.id,
          completedAt: session.completedAt,
          value,
          hasQualityFlags:
            session.qualityFlags.length > 0,
        },
      ];
    })
    .sort(
      (first, second) =>
        new Date(first.completedAt).getTime() -
        new Date(second.completedAt).getTime()
    );
}

export function getStroopTrendSummary(
  metric: StroopTrendMetric,
  points: StroopTrendPoint[]
): StroopTrendSummary | null {
  if (points.length < 2) {
    return null;
  }

  const first = points[0];
  const latest = points[points.length - 1];
  const change = latest.value - first.value;

  if (metric === "accuracy") {
    return {
      change,
      displayValue: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      tone:
        change > 0
          ? "good"
          : change < 0
            ? "bad"
            : "neutral",
    };
  }

  const roundedChange = Math.round(change);

  return {
    change,
    displayValue: `${
      roundedChange >= 0 ? "+" : ""
    }${roundedChange} ms`,
    tone:
      roundedChange === 0
        ? "neutral"
        : roundedChange < 0
          ? "good"
          : "bad",
  };
}