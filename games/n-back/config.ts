import type { NBackConfig } from "../types";

/**
 * BET Training's initial visual-position N-Back protocol.
 *
 * The fixed session duration is independent from the timed Stroop task.
 * A completed trial lasts 2.5 seconds: 2 seconds of stimulus response
 * time and 500 milliseconds of feedback or inter-trial time.
 */
export const defaultNBackConfig: NBackConfig = {
  gameId: "n-back",
  configVersion: "1.0.0",
  sessionMode: "fixed-duration",
  sessionDurationMs: 180000,
  stimulusDurationMs: 2000,
  interTrialIntervalMs: 500,
  responseWindowMs: 2000,
  nLevel: 2,
  targetProportion: 1 / 3,
  stimulusSet: [
    "top-left",
    "top-centre",
    "top-right",
    "middle-left",
    "centre",
    "middle-right",
    "bottom-left",
    "bottom-centre",
    "bottom-right",
  ],
  feedbackCorrectMs: 300,
  feedbackIncorrectMs: 400,
};
