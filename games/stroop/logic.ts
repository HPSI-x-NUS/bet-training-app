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
function validateConfig(config: StroopConfig) {
  const {
    colors,
    incongruentProportion,
    responseMapping,
  } = config;

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
}

/** Generate one trial for the timed protocol. */
export function generateStroopTrial(
  config: StroopConfig,
  trialIndex: number
): StroopTrial {
  validateConfig(config);

  if (!Number.isInteger(trialIndex) || trialIndex < 0) {
    throw new Error("trialIndex must be a non-negative integer.");
  }

  const { colors, incongruentProportion, responseMapping } = config;
  const isIncongruent = Math.random() < incongruentProportion;

  if (!isIncongruent) {
    const color = randomItem(colors);
    return {
      trialIndex,
      word: color,
      inkColor: color,
      congruency: "congruent",
      correctResponse: responseMapping[color],
    };
  }

  const inkColor = randomItem(colors);
  const word = randomItem(colors.filter((color) => color !== inkColor));

  return {
    trialIndex,
    word,
    inkColor,
    congruency: "incongruent",
    correctResponse: responseMapping[inkColor],
  };
}

/** Legacy helper retained for fixed-count protocol tests. */
export function generateStroopTrials(
  config: StroopConfig,
  totalTrials: number
): StroopTrial[] {
  validateConfig(config);

  if (!Number.isInteger(totalTrials) || totalTrials <= 0) {
    throw new Error("totalTrials must be a positive integer.");
  }

  return Array.from({ length: totalTrials }, (_, index) =>
    generateStroopTrial(config, index)
  );
}
