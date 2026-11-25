import assert from "node:assert/strict";

import type { NBackTrialResult } from "../types";
import { calculateNBackMetrics } from "./statistics";

function makeTrial(
  trialIndex: number,
  responseType: NBackTrialResult["responseType"],
  reactionTimeMs: number | null = null
): NBackTrialResult {
  const isTarget =
    responseType === "hit" || responseType === "miss";
  const hasResponse =
    responseType === "hit" || responseType === "false-alarm";

  return {
    gameId: "n-back",
    trialIndex,
    stimulus: "centre",
    comparisonStimulus: isTarget ? "centre" : "top-left",
    isTarget,
    responseType,
    response: hasResponse ? "match" : null,
    correctResponse: isTarget ? "match" : null,
    isCorrect:
      responseType === "hit" ||
      responseType === "correct-rejection",
    reactionTimeMs,
    stimulusOnsetMs: 1000,
    responseTimestampMs:
      reactionTimeMs === null ? null : 1000 + reactionTimeMs,
  };
}

const metrics = calculateNBackMetrics([
  makeTrial(0, "hit", 600),
  makeTrial(1, "hit", 800),
  makeTrial(2, "miss"),
  makeTrial(3, "false-alarm", 700),
  makeTrial(4, "correct-rejection"),
  makeTrial(5, "correct-rejection"),
]);

assert.equal(metrics.totalTrials, 6);
assert.equal(metrics.correctTrials, 4);
assert.equal(metrics.incorrectTrials, 2);
assert.equal(metrics.accuracy, (4 / 6) * 100);
assert.equal(metrics.meanReactionTimeMs, 700);
assert.equal(metrics.additionalMetrics?.hits, 2);
assert.equal(metrics.additionalMetrics?.misses, 1);
assert.equal(metrics.additionalMetrics?.falseAlarms, 1);
assert.equal(metrics.additionalMetrics?.correctRejections, 2);
assert.equal(metrics.additionalMetrics?.hitRate, 2 / 3);
assert.equal(metrics.additionalMetrics?.falseAlarmRate, 1 / 3);
assert.ok(
  typeof metrics.additionalMetrics?.dPrime === "number" &&
    Number.isFinite(metrics.additionalMetrics.dPrime)
);

const emptyMetrics = calculateNBackMetrics([]);

assert.equal(emptyMetrics.accuracy, 0);
assert.equal(emptyMetrics.meanReactionTimeMs, null);
assert.equal(emptyMetrics.additionalMetrics?.dPrime, null);

console.info("N-Back statistics tests passed.");
