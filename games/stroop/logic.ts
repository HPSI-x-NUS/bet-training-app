import type {
  StroopColor,
  StroopConfig,
} from "../types";

/**
 * A planned Stroop trial, before the athlete responds.
 *
 * This is different from StroopTrialResult, which
 * records the athlete's actual performance.
 */
export interface StroopTrial {
  trialIndex: number;
  word: StroopColor;
  inkColor: StroopColor;
  congruency: "congruent" | "incongruent";
  correctResponse: string;
}

/**
 * Return one randomly selected item from an array.
 */
function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Shuffle an array without modifying the original.
 * Uses the Fisher-Yates algorithm.
 */
function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * SESSION GENERATION STRATEGY
 *
 * CURRENT: Fixed-trial protocol
 *
 * Generate exactly config.totalTrials trials before gameplay.
 * The game ends when every trial has been presented and resolved.
 *
 * POSSIBLE FUTURE: Fixed-duration protocol
 *
 * Instead of pre-generating a fixed number of trials,
 * the game engine could generate trials incrementally
 * until the session timer expires.
 *
 * Keep stimulus generation separate from the session
 * ending condition so both modes can reuse the same
 * Stroop rules and response evaluation.
 */
export function generateStroopTrials(
  config: StroopConfig
): StroopTrial[] {
  const {
    totalTrials,
    colors,
    incongruentProportion,
    responseMapping,
  } = config;

  // Validate configuration before generating trials.
  if (!Number.isInteger(totalTrials) || totalTrials <= 0) {
    throw new Error("totalTrials must be a positive integer.");
  }

  if (
    !Number.isFinite(incongruentProportion) ||
    incongruentProportion < 0 ||
    incongruentProportion > 1
  ) {
    throw new Error(
      "incongruentProportion must be between 0 and 1."
    );
  }

  if (new Set(colors).size !== colors.length) {
    throw new Error("Stroop colours must be unique.");
  }

  if (colors.length < 2) {
    throw new Error(
      "Stroop requires at least two colours."
    );
  }

  for (const color of colors) {
    if (!responseMapping[color]) {
      throw new Error(
        `Missing response mapping for ${color}.`
      );
    }
  }

  const incongruentCount = Math.round(
    totalTrials * incongruentProportion
  );

  const congruentCount = totalTrials - incongruentCount;

  const trials: StroopTrial[] = [];

  // Generate congruent trials.
  for (let i = 0; i < congruentCount; i++) {
    const color = randomItem(colors);

    trials.push({
      trialIndex: 0,
      word: color,
      inkColor: color,
      congruency: "congruent",
      correctResponse: responseMapping[color],
    });
  }

  // Generate incongruent trials.
  for (let i = 0; i < incongruentCount; i++) {
    const inkColor = randomItem(colors);

    const possibleWords = colors.filter(
      (color) => color !== inkColor
    );

    const word = randomItem(possibleWords);

    trials.push({
      trialIndex: 0,
      word,
      inkColor,
      congruency: "incongruent",
      correctResponse: responseMapping[inkColor],
    });
  }

  // Randomize trial order and assign zero-based indices.
  return shuffle(trials).map((trial, index) => ({
    ...trial,
    trialIndex: index,
  }));
}
