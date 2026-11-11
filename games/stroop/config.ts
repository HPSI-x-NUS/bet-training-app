import type { StroopConfig } from "../types";

/**
 * BET Training - Stroop Test Configuration
 *
 * Provisional parameters for the capstone prototype.
 * All timing values are in milliseconds.
 */

export const defaultStroopConfig: StroopConfig = {
  gameId: "stroop",

  configVersion: "1.0.0",

  // 20 congruent + 20 incongruent trials.
  totalTrials: 40,

  // How long the word remains visible.
  stimulusDurationMs: 1500,

  // Time between trials.
  interTrialIntervalMs: 500,

  // Maximum time allowed for a response.
  responseWindowMs: 2000,

  colors: ["red", "blue", "green", "yellow"],

  // Half of the trials are incongruent.
  incongruentProportion: 0.5,

  // Four on-screen response buttons.
  responseMapping: {
    red: "red",
    blue: "blue",
    green: "green",
    yellow: "yellow",
  },
};
