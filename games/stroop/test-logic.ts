import { defaultStroopConfig } from "./config";
import { generateStroopTrials } from "./logic";

const trials = generateStroopTrials(defaultStroopConfig, 40);

const congruent = trials.filter(
  (trial) => trial.congruency === "congruent"
);

const incongruent = trials.filter(
  (trial) => trial.congruency === "incongruent"
);

const allValid = trials.every((trial, index) => {
  const matches = trial.word === trial.inkColor;

  const correctCondition =
    trial.congruency ===
    (matches ? "congruent" : "incongruent");

  const correctAnswer =
    trial.correctResponse ===
    defaultStroopConfig.responseMapping[trial.inkColor];

  return (
    trial.trialIndex === index &&
    correctCondition &&
    correctAnswer
  );
});

console.log("Total trials:", trials.length);
console.log("Congruent trials:", congruent.length);
console.log("Incongruent trials:", incongruent.length);
console.log("All trials valid:", allValid);
console.log("First five trials:", trials.slice(0, 5));

if (trials.length !== 40 || congruent.length + incongruent.length !== 40 || !allValid) {
  throw new Error("Stroop trial-generation test failed.");
}

console.log("Stroop trial-generation test passed!");
