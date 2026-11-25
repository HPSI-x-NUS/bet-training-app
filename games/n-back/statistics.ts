import type {
  NBackTrialResult,
  SessionMetrics,
} from "../types";

function calculateMean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function inverseStandardNormal(probability: number) {
  const p = Math.min(1 - 0.000001, Math.max(0.000001, probability));
  const a1 = -39.6968302866538;
  const a2 = 220.946098424521;
  const a3 = -275.928510446969;
  const a4 = 138.357751867269;
  const a5 = -30.6647980661472;
  const a6 = 2.50662827745924;
  const b1 = -54.4760987982241;
  const b2 = 161.585836858041;
  const b3 = -155.698979859887;
  const b4 = 66.8013118877197;
  const b5 = -13.2806815528857;
  const c1 = -0.00778489400243029;
  const c2 = -0.322396458041136;
  const c3 = -2.40075827716184;
  const c4 = -2.54973253934373;
  const c5 = 4.37466414146497;
  const c6 = 2.93816398269878;
  const d1 = 0.00778469570904146;
  const d2 = 0.32246712907004;
  const d3 = 2.445134137143;
  const d4 = 3.75440866190742;
  const lowerRegion = 0.02425;
  const upperRegion = 1 - lowerRegion;

  if (p < lowerRegion) {
    const q = Math.sqrt(-2 * Math.log(p));
    const numerator =
      ((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q +
      c6;
    const denominator =
      (((d1 * q + d2) * q + d3) * q + d4) * q + 1;

    return numerator / denominator;
  }

  if (p > upperRegion) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    const numerator =
      ((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q +
      c6;
    const denominator =
      (((d1 * q + d2) * q + d3) * q + d4) * q + 1;

    return -(numerator / denominator);
  }

  const q = p - 0.5;
  const r = q * q;

  const numerator =
    (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) *
    q;
  const denominator =
    (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r) + 1;

  return numerator / denominator;
}

/**
 * Calculate N-Back metrics without gamification values.
 *
 * d-prime uses log-linear corrected rates so sessions with no hits or no
 * false alarms still produce finite, descriptive values.
 */
export function calculateNBackMetrics(
  results: NBackTrialResult[]
): SessionMetrics {
  const hits = results.filter(
    (result) => result.responseType === "hit"
  );
  const misses = results.filter(
    (result) => result.responseType === "miss"
  );
  const falseAlarms = results.filter(
    (result) => result.responseType === "false-alarm"
  );
  const correctRejections = results.filter(
    (result) => result.responseType === "correct-rejection"
  );
  const targetTrials = hits.length + misses.length;
  const nonTargetTrials =
    falseAlarms.length + correctRejections.length;
  const totalTrials = results.length;
  const correctTrials = hits.length + correctRejections.length;
  const incorrectTrials = misses.length + falseAlarms.length;
  const accuracy =
    totalTrials === 0 ? 0 : (correctTrials / totalTrials) * 100;
  const hitRate =
    targetTrials === 0 ? null : hits.length / targetTrials;
  const falseAlarmRate =
    nonTargetTrials === 0 ? null : falseAlarms.length / nonTargetTrials;
  const correctedHitRate =
    targetTrials === 0
      ? null
      : (hits.length + 0.5) / (targetTrials + 1);
  const correctedFalseAlarmRate =
    nonTargetTrials === 0
      ? null
      : (falseAlarms.length + 0.5) / (nonTargetTrials + 1);
  const dPrime =
    correctedHitRate === null || correctedFalseAlarmRate === null
      ? null
      : inverseStandardNormal(correctedHitRate) -
        inverseStandardNormal(correctedFalseAlarmRate);
  const hitReactionTimes = hits
    .map((result) => result.reactionTimeMs)
    .filter(
      (reactionTime): reactionTime is number =>
        reactionTime !== null && Number.isFinite(reactionTime)
    );

  return {
    totalTrials,
    correctTrials,
    incorrectTrials,
    accuracy,
    meanReactionTimeMs: calculateMean(hitReactionTimes),
    additionalMetrics: {
      targetTrials,
      nonTargetTrials,
      hits: hits.length,
      misses: misses.length,
      falseAlarms: falseAlarms.length,
      correctRejections: correctRejections.length,
      hitRate,
      falseAlarmRate,
      dPrime,
    },
  };
}
