import type {
    SessionMetrics,
    StroopTrialResult,
} from "../types";

/**
 * Calculate the arithmetic mean of valid numbers.
 *
 * Returns null when no values are available.
 */
function calculateMean(values: number[]): number | null {
    if (values.length === 0) {
        return null;
    }

    const total = values.reduce(
        (sum, value) => sum + value,
        0
    );

    return total / values.length;
}

/**
 * Calculate accuracy as a percentage.
 *
 * Timeouts are included in the denominator.
 * Returns null when no trials are available.
 */
function calculateAccuracy(
    correct: number,
    total: number
): number | null {
    if (total === 0) {
        return null;
    }

    return (correct / total) * 100;
}

/**
 * Calculate cognitive performance metrics for
 * a completed or partially completed Stroop session.
 *
 * Gamification points and XP are intentionally
 * excluded from these metrics.
 */
export function calculateStroopMetrics(
    results: StroopTrialResult[]
): SessionMetrics {
    const totalTrials = results.length;

    // Separate answered trials from timeouts.
    const correctResults = results.filter(
        (result) => result.isCorrect
    );

    const incorrectResults = results.filter(
        (result) =>
            result.response !== null &&
            !result.isCorrect
    );

    const timeoutResults = results.filter(
        (result) => result.response === null
    );

    const correctTrials = correctResults.length;
    const incorrectTrials = incorrectResults.length;
    const timeoutTrials = timeoutResults.length;

    // Overall accuracy includes timeouts.
    const accuracy =
        calculateAccuracy(correctTrials, totalTrials) ?? 0;

    // Reaction times are calculated only from
    // correct responses with valid RT measurements.
    const correctReactionTimes = correctResults
        .map((result) => result.reactionTimeMs)
        .filter((rt): rt is number =>
            rt !== null &&
            Number.isFinite(rt) &&
            rt >= 0
        );

    const meanReactionTimeMs = calculateMean(
        correctReactionTimes
    );

    // Separate trials by Stroop congruency.
    const congruentResults = results.filter(
        (result) => result.congruency === "congruent"
    );

    const incongruentResults = results.filter(
        (result) => result.congruency === "incongruent"
    );

    const congruentCorrect = congruentResults.filter(
        (result) => result.isCorrect
    );

    const incongruentCorrect = incongruentResults.filter(
        (result) => result.isCorrect
    );

    const congruentAccuracy = calculateAccuracy(
        congruentCorrect.length,
        congruentResults.length
    );

    const incongruentAccuracy = calculateAccuracy(
        incongruentCorrect.length,
        incongruentResults.length
    );

    // Mean RT for correct congruent trials.
    const congruentReactionTimes = congruentCorrect
        .map((result) => result.reactionTimeMs)
        .filter((rt): rt is number =>
            rt !== null &&
            Number.isFinite(rt) &&
            rt >= 0
        );

    const meanCongruentRT = calculateMean(
        congruentReactionTimes
    );

    // Mean RT for correct incongruent trials.
    const incongruentReactionTimes = incongruentCorrect
        .map((result) => result.reactionTimeMs)
        .filter((rt): rt is number =>
            rt !== null &&
            Number.isFinite(rt) &&
            rt >= 0
        );

    const meanIncongruentRT = calculateMean(
        incongruentReactionTimes
    );

    // Stroop interference effect:
    // Incongruent RT minus congruent RT.
    //
    // Positive values indicate slower responses
    // during incongruent trials.
    const stroopInterferenceMs =
        meanCongruentRT !== null &&
        meanIncongruentRT !== null
            ? meanIncongruentRT - meanCongruentRT
            : null;

    return {
        totalTrials,
        correctTrials,
        incorrectTrials,
        accuracy,
        meanReactionTimeMs,

        additionalMetrics: {
            timeoutTrials,
            congruentTrials: congruentResults.length,
            incongruentTrials: incongruentResults.length,
            congruentAccuracy,
            incongruentAccuracy,
            meanCongruentRT,
            meanIncongruentRT,
            stroopInterferenceMs,
        },
    };
}
