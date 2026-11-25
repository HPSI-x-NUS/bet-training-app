import type {
  NBackConfig,
  NBackPosition,
} from "../types";

const TARGET_BLOCK_SIZE = 6;

export interface NBackTrial {
  trialIndex: number;
  stimulus: NBackPosition;
  comparisonStimulus: NBackPosition | null;
  isTarget: boolean;
  correctResponse: "match" | null;
}

function randomItem<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function validateNBackConfig(config: NBackConfig) {
  if (config.sessionMode !== "fixed-duration") {
    throw new Error("N-Back requires a fixed-duration session.");
  }

  if (!Number.isInteger(config.nLevel) || config.nLevel < 1) {
    throw new Error("nLevel must be a positive whole number.");
  }

  if (
    !Number.isFinite(config.targetProportion) ||
    config.targetProportion <= 0 ||
    config.targetProportion >= 1
  ) {
    throw new Error("targetProportion must be between 0 and 1.");
  }

  if (new Set(config.stimulusSet).size !== config.stimulusSet.length) {
    throw new Error("N-Back stimulus positions must be unique.");
  }

  if (config.stimulusSet.length < 2) {
    throw new Error("N-Back requires at least two stimulus positions.");
  }

  if (
    config.feedbackCorrectMs < 0 ||
    config.feedbackIncorrectMs < 0 ||
    config.feedbackCorrectMs > config.interTrialIntervalMs ||
    config.feedbackIncorrectMs > config.interTrialIntervalMs
  ) {
    throw new Error(
      "N-Back feedback must fit inside the inter-trial interval."
    );
  }
}

function getTargetCountPerBlock(config: NBackConfig) {
  const targetCount = config.targetProportion * TARGET_BLOCK_SIZE;

  if (!Number.isInteger(targetCount)) {
    throw new Error(
      "targetProportion must produce a whole target count per block."
    );
  }

  return targetCount;
}

function shouldGenerateTarget(
  config: NBackConfig,
  previousTrials: NBackTrial[],
  random: () => number
) {
  const targetCountPerBlock = getTargetCountPerBlock(config);
  const eligibleTrialIndex = previousTrials.length - config.nLevel;
  const blockStartEligibleIndex =
    Math.floor(eligibleTrialIndex / TARGET_BLOCK_SIZE) *
    TARGET_BLOCK_SIZE;
  const blockStartTrialIndex =
    config.nLevel + blockStartEligibleIndex;
  const trialsInBlock = previousTrials.slice(blockStartTrialIndex);
  const targetsAlreadyGenerated = trialsInBlock.filter(
    (trial) => trial.isTarget
  ).length;
  const remainingSlots = TARGET_BLOCK_SIZE - trialsInBlock.length;
  const remainingTargets =
    targetCountPerBlock - targetsAlreadyGenerated;

  return random() < remainingTargets / remainingSlots;
}

/**
 * Generate the next planned N-Back trial.
 *
 * Every complete six-trial eligible block contains two targets. The target
 * positions remain random, while the block keeps the protocol's one-third
 * target proportion stable across the three-minute timed session.
 */
export function generateNBackTrial(
  config: NBackConfig,
  previousTrials: NBackTrial[],
  random: () => number = Math.random
): NBackTrial {
  validateNBackConfig(config);

  const trialIndex = previousTrials.length;
  const comparisonTrial = previousTrials[trialIndex - config.nLevel];
  const comparisonStimulus = comparisonTrial?.stimulus ?? null;

  if (comparisonStimulus === null) {
    return {
      trialIndex,
      stimulus: randomItem(config.stimulusSet, random),
      comparisonStimulus: null,
      isTarget: false,
      correctResponse: null,
    };
  }

  const isTarget = shouldGenerateTarget(config, previousTrials, random);
  const stimulus = isTarget
    ? comparisonStimulus
    : randomItem(
        config.stimulusSet.filter(
          (position) => position !== comparisonStimulus
        ),
        random
      );

  return {
    trialIndex,
    stimulus,
    comparisonStimulus,
    isTarget,
    correctResponse: isTarget ? "match" : null,
  };
}
