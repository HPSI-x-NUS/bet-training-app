import assert from "node:assert/strict";

import type { StroopTrialResult } from "../types";
import { calculateStroopMetrics } from "./statistics";

// Create a predictable trial result for testing.
function makeTrial(
    index: number,
    congruency: "congruent" | "incongruent",
    outcome: "correct" | "incorrect" | "timeout",
    reactionTimeMs: number | null
): StroopTrialResult {
    const word = "red";
    const inkColor =
        congruency === "congruent" ? "red" : "blue";

    return {
        gameId: "stroop",
        trialIndex: index,
        word,
        inkColor,
        congruency,
        correctResponse: inkColor,
        response:
            outcome === "timeout"
                ? null
                : outcome === "correct"
                  ? inkColor
                  : "green",
        isCorrect: outcome === "correct",
        reactionTimeMs,
        stimulusOnsetMs: 1000,
        responseTimestampMs:
            reactionTimeMs === null
                ? null
                : 1000 + reactionTimeMs,
    };
}

// 40 trials:
// Congruent: 16 correct, 2 incorrect, 2 timeouts.
// Incongruent: 14 correct, 4 incorrect, 2 timeouts.
const trials: StroopTrialResult[] = [
    ...Array.from({ length: 16 }, (_, i) =>
        makeTrial(i, "congruent", "correct", 520)
    ),
    ...Array.from({ length: 2 }, (_, i) =>
        makeTrial(i + 16, "congruent", "incorrect", 700)
    ),
    ...Array.from({ length: 2 }, (_, i) =>
        makeTrial(i + 18, "congruent", "timeout", null)
    ),
    ...Array.from({ length: 14 }, (_, i) =>
        makeTrial(i + 20, "incongruent", "correct", 680)
    ),
    ...Array.from({ length: 4 }, (_, i) =>
        makeTrial(i + 34, "incongruent", "incorrect", 900)
    ),
    ...Array.from({ length: 2 }, (_, i) =>
        makeTrial(i + 38, "incongruent", "timeout", null)
    ),
];

const metrics = calculateStroopMetrics(trials);

// Overall performance.
assert.equal(metrics.totalTrials, 40);
assert.equal(metrics.correctTrials, 30);
assert.equal(metrics.incorrectTrials, 6);
assert.equal(metrics.accuracy, 75);

// Stroop-specific performance.
assert.equal(metrics.additionalMetrics?.timeoutTrials, 4);
assert.equal(metrics.additionalMetrics?.congruentAccuracy, 80);
assert.equal(metrics.additionalMetrics?.incongruentAccuracy, 70);

assert.equal(metrics.additionalMetrics?.meanCongruentRT, 520);
assert.equal(metrics.additionalMetrics?.meanIncongruentRT, 680);
assert.equal(metrics.additionalMetrics?.stroopInterferenceMs, 160);

// Overall mean RT uses correct responses only.
const expectedMeanRT = (16 * 520 + 14 * 680) / 30;
assert.ok(
    metrics.meanReactionTimeMs !== null &&
    Math.abs(metrics.meanReactionTimeMs - expectedMeanRT) < 0.000001
);

// Empty session.
const emptyMetrics = calculateStroopMetrics([]);
assert.equal(emptyMetrics.totalTrials, 0);
assert.equal(emptyMetrics.accuracy, 0);
assert.equal(emptyMetrics.meanReactionTimeMs, null);
assert.equal(
    emptyMetrics.additionalMetrics?.stroopInterferenceMs,
    null
);

// No correct responses.
const noCorrectMetrics = calculateStroopMetrics([
    makeTrial(0, "congruent", "incorrect", 500),
    makeTrial(1, "incongruent", "timeout", null),
]);

assert.equal(noCorrectMetrics.correctTrials, 0);
assert.equal(noCorrectMetrics.meanReactionTimeMs, null);
assert.equal(
    noCorrectMetrics.additionalMetrics?.stroopInterferenceMs,
    null
);

console.log("All Stroop statistics tests passed.");
