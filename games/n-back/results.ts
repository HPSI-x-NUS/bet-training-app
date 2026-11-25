import type { NBackTrialResult } from "../types";
import type { NBackTrial } from "./logic";

interface CreateNBackResultParams {
  trial: NBackTrial;
  response: "match" | null;
  stimulusOnsetMs: number;
  responseTimestampMs: number | null;
}

export function createNBackTrialResult({
  trial,
  response,
  stimulusOnsetMs,
  responseTimestampMs,
}: CreateNBackResultParams): NBackTrialResult {
  const hasResponse =
    response === "match" && responseTimestampMs !== null;
  const reactionTimeMs = hasResponse
    ? Math.max(0, responseTimestampMs - stimulusOnsetMs)
    : null;
  const responseType = trial.isTarget
    ? hasResponse
      ? "hit"
      : "miss"
    : hasResponse
      ? "false-alarm"
      : "correct-rejection";

  return {
    gameId: "n-back",
    trialIndex: trial.trialIndex,
    stimulus: trial.stimulus,
    comparisonStimulus: trial.comparisonStimulus,
    isTarget: trial.isTarget,
    responseType,
    response: hasResponse ? "match" : null,
    correctResponse: trial.correctResponse,
    isCorrect:
      responseType === "hit" ||
      responseType === "correct-rejection",
    reactionTimeMs,
    stimulusOnsetMs,
    responseTimestampMs: hasResponse
      ? responseTimestampMs
      : null,
  };
}

export function validateNBackResults(
  results: NBackTrialResult[]
): boolean {
  const indices = results.map((result) => result.trialIndex);

  return indices.every(
    (index, expectedIndex) =>
      Number.isInteger(index) && index === expectedIndex
  );
}
