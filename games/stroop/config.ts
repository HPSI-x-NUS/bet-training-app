import type { StroopConfig } from "../types";

/**
 * BET Training - Stroop Test Configuration
 *
 * Provisional parameters for the capstone prototype.
 * All timing values are in milliseconds.
 */

export const defaultStroopConfig: StroopConfig = {
  gameId: "stroop",

  configVersion: "2.0.0",

  /**
   * SESSION ENDING CONDITION
   *
   * CURRENT MODE: Fixed number of trials
   * The session ends after all 40 trials have been presented.
   *
   * FUTURE OPTION: Fixed-duration challenge
   * The session would end after a specified duration,
   * regardless of the number of trials completed.
   *
   * To implement time-based mode in the future:
   * 1. Add a sessionMode setting ("fixed-trials" | "fixed-time").
   * 2. Add a sessionDurationMs setting.
   * 3. Update the game engine to use the selected ending condition.
   * 4. Keep trial-level results and cognitive metrics unchanged.
   *
   * IMPORTANT:
   * The responseWindowMs setting controls the deadline
   * for EACH trial, not the overall session duration.
   */

  // Fixed-duration protocol. Trials are generated as the session proceeds.
  sessionMode: "fixed-duration",
  sessionDurationMs: 180000,

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
