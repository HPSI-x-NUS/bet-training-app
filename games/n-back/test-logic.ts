import assert from "node:assert/strict";

import { defaultNBackConfig } from "./config";
import { generateNBackTrial, type NBackTrial } from "./logic";

let randomValue = 0;
const deterministicRandom = () => {
  randomValue = (randomValue + 0.17) % 1;
  return randomValue;
};

const trials: NBackTrial[] = [];

for (let index = 0; index < 20; index += 1) {
  trials.push(
    generateNBackTrial(defaultNBackConfig, trials, deterministicRandom)
  );
}

assert.equal(trials[0].isTarget, false);
assert.equal(trials[1].isTarget, false);
assert.equal(trials[0].comparisonStimulus, null);
assert.equal(trials[1].comparisonStimulus, null);

trials.slice(2).forEach((trial) => {
  const comparison = trials[trial.trialIndex - 2].stimulus;

  assert.equal(trial.comparisonStimulus, comparison);
  assert.equal(
    trial.isTarget,
    trial.stimulus === trial.comparisonStimulus
  );
  assert.equal(
    trial.correctResponse,
    trial.isTarget ? "match" : null
  );
});

const eligibleTrials = trials.slice(2);

for (let start = 0; start < eligibleTrials.length; start += 6) {
  const block = eligibleTrials.slice(start, start + 6);

  if (block.length === 6) {
    assert.equal(
      block.filter((trial) => trial.isTarget).length,
      2
    );
  }
}

console.info("N-Back trial-generation tests passed.");
