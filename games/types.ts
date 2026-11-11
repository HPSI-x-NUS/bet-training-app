/**
 * BET Training — Shared Cognitive Game Types
 *
 * These types define a common contract for all cognitive tasks.
 * Scientific performance data remains separate from gamification.
 */

// ============================================================
// 1. Game identification
// ============================================================

export type GameId =
  | "stroop"
  | "n-back"
  | "flanker"
  | "go-no-go";

export type GameStatus =
  | "completed"
  | "aborted";

// ============================================================
// 2. Shared game configuration
// ============================================================

export interface BaseGameConfig {
  gameId: GameId;

  // Increment when the scientific task protocol changes.
  configVersion: string;

  // Number of trials planned for the session.
  totalTrials: number;

  // Timing values are expressed in milliseconds.
  stimulusDurationMs: number;
  interTrialIntervalMs: number;
  responseWindowMs: number;
}

// ============================================================
// 3. Game-specific configurations
// ============================================================

export type ResponseKey = "left" | "right";

export type StroopColor =
  | "red"
  | "blue"
  | "green"
  | "yellow";

export interface StroopConfig extends BaseGameConfig {
  gameId: "stroop";
  colors: StroopColor[];
  incongruentProportion: number;
  responseMapping: Record<StroopColor, string>;
}

export interface NBackConfig extends BaseGameConfig {
  gameId: "n-back";

  // Example: 2 means a 2-back task.
  nLevel: number;

  targetProportion: number;
  stimulusSet: string[];
}

export interface FlankerConfig extends BaseGameConfig {
  gameId: "flanker";
  incongruentProportion: number;

  responseMapping: Record<ResponseKey, string>;
}

export interface GoNoGoConfig extends BaseGameConfig {
  gameId: "go-no-go";

  // Typically approximately 0.75.
  goProportion: number;

  goStimulus: string;
  noGoStimulus: string;
}

// Discriminated union: gameId determines the config shape.
export type GameConfig =
  | StroopConfig
  | NBackConfig
  | FlankerConfig
  | GoNoGoConfig;

// ============================================================
// 4. Shared trial results
// ============================================================

export interface BaseTrialResult {
  trialIndex: number;

  // Measured from stimulus onset.
  reactionTimeMs: number | null;

  // Null indicates that no response was recorded.
  response: string | null;

  correctResponse: string | null;
  isCorrect: boolean;

  // Actual timestamps for the trial.
  stimulusOnsetMs: number;
  responseTimestampMs: number | null;
}

// ============================================================
// 5. Game-specific trial results
// ============================================================

export interface StroopTrialResult extends BaseTrialResult {
  gameId: "stroop";

  word: StroopColor;
  inkColor: StroopColor;

  congruency: "congruent" | "incongruent";
}

export interface NBackTrialResult extends BaseTrialResult {
  gameId: "n-back";

  stimulus: string;
  isTarget: boolean;

  // Useful for distinguishing hits, misses,
  // false alarms and correct rejections.
  responseType:
    | "hit"
    | "miss"
    | "false-alarm"
    | "correct-rejection";
}

export interface FlankerTrialResult extends BaseTrialResult {
  gameId: "flanker";

  targetDirection: ResponseKey;
  flankerDirection: ResponseKey;

  congruency: "congruent" | "incongruent";
}

export interface GoNoGoTrialResult extends BaseTrialResult {
  gameId: "go-no-go";

  trialType: "go" | "no-go";

  errorType:
    | "commission"
    | "omission"
    | null;
}

// Each game returns its own trial data,
// while preserving a shared result structure.
export type TrialResult =
  | StroopTrialResult
  | NBackTrialResult
  | FlankerTrialResult
  | GoNoGoTrialResult;

// ============================================================
// 6. Session-level cognitive performance
// ============================================================

export interface SessionMetrics {
  totalTrials: number;
  correctTrials: number;
  incorrectTrials: number;

  // Percentage from 0 to 100.
  accuracy: number;

  // Calculated from valid responses.
  meanReactionTimeMs: number | null;

  // Optional task-specific computed measures.
  additionalMetrics?: Record<string, number | null>;
}

// ============================================================
// 7. Complete session result
// ============================================================

export interface SessionResult {
  sessionId: string;
  athleteId: string;

  gameId: GameId;
  config: GameConfig;

  status: GameStatus;

  startedAt: string;
  completedAt: string | null;

  metrics: SessionMetrics;
  trials: TrialResult[];
}
