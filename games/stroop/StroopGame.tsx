"use client";

import { useState } from "react";

import { defaultStroopConfig } from "./config";
import {
  generateStroopTrials,
  type StroopTrial,
} from "./logic";

type GamePhase = "instructions" | "playing";

const colorStyles = {
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#16A34A",
  yellow: "#EAB308",
};

export default function StroopGame() {
  const [phase, setPhase] =
    useState<GamePhase>("instructions");

  const [trials, setTrials] = useState<StroopTrial[]>([]);

  const [currentTrialIndex, setCurrentTrialIndex] =
    useState(0);

  const currentTrial = trials[currentTrialIndex];

  function startGame() {
    const generatedTrials =
      generateStroopTrials(defaultStroopConfig);

    setTrials(generatedTrials);
    setCurrentTrialIndex(0);
    setPhase("playing");
  }

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-10">
      {phase === "instructions" && (
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Stroop Test
          </h1>

          <p className="text-slate-600">
            Select the INK COLOUR of the word,
            not what the word says.
          </p>

          <div className="rounded-2xl border bg-white p-10">
            <p className="mb-4 text-sm text-slate-500">
              Example
            </p>

            <p
              className="text-6xl font-extrabold"
              style={{ color: colorStyles.blue }}
            >
              RED
            </p>

            <p className="mt-5 text-slate-600">
              Correct answer: Blue
            </p>
          </div>

          <p className="text-sm text-slate-500">
            {defaultStroopConfig.totalTrials} trials
            {" · "}
            Four colour buttons
          </p>

          <button
            type="button"
            onClick={startGame}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Start Training
          </button>
        </div>
      )}

      {phase === "playing" && currentTrial && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Stroop Test
            </h1>

            <span className="text-sm text-slate-500">
              Trial {currentTrialIndex + 1} / {trials.length}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${
                  (currentTrialIndex / trials.length) * 100
                }%`,
              }}
            />
          </div>

          <div className="rounded-2xl border bg-white p-12 text-center">
            <p className="mb-8 text-sm text-slate-500">
              Select the INK COLOUR
            </p>

            <p
              className="text-6xl font-extrabold"
              style={{
                color: colorStyles[currentTrial.inkColor],
              }}
            >
              {currentTrial.word.toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {defaultStroopConfig.colors.map((color) => (
              <button
                key={color}
                type="button"
                disabled
                className="rounded-xl border-2 border-slate-200 bg-white p-5 font-semibold text-slate-800 opacity-70"
              >
                {color.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
            Response buttons will be enabled in Milestone 5B.
          </p>
        </div>
      )}
    </main>
  );
}
