import type { StroopTrialResult } from "../types";
import type { StroopTrial } from "./logic";

interface CreateStroopResultParams {
    trial: StroopTrial;
    response: string | null;
    stimulusOnsetMs: number;
    responseTimestampMs: number | null;
}

export function createStroopTrialResult({
    trial,
    response,
    stimulusOnsetMs,
    responseTimestampMs,
}: CreateStroopResultParams): StroopTrialResult {
    const hasResponse =
        response !== null && responseTimestampMs !== null;

    const reactionTimeMs = hasResponse
        ? Math.max(0, responseTimestampMs - stimulusOnsetMs)
        : null;

    return {
        gameId: "stroop",
        trialIndex: trial.trialIndex,
        word: trial.word,
        inkColor: trial.inkColor,
        congruency: trial.congruency,
        response: hasResponse ? response : null,
        correctResponse: trial.correctResponse,
        isCorrect: hasResponse &&
            response === trial.correctResponse,
        reactionTimeMs,
        stimulusOnsetMs,
        responseTimestampMs: hasResponse
            ? responseTimestampMs
            : null,
    };
}

export function validateStroopResults(
    results: StroopTrialResult[],
    expectedTrials: number
): boolean {
    if (results.length !== expectedTrials) {
        return false;
    }

    const indices = results.map((result) => result.trialIndex);
    const uniqueIndices = new Set(indices);

    if (uniqueIndices.size !== expectedTrials) {
        return false;
    }

    return indices.every(
        (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < expectedTrials
    );
}
