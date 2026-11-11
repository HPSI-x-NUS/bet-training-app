"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
    // ==========================================
    // Scoring and response feedback
    // ==========================================

    const [score, setScore] = useState(0);

    const [feedback, setFeedback] = useState<
        "correct" | "incorrect" | "timeout" | null
    >(null);

    const [reactionTimes, setReactionTimes] =
        useState<number[]>([]);

    // Track reaction time without causing re-renders.
    const trialStartTime = useRef<number>(0);

    // Prevent multiple responses to the same trial.
    const responseLocked = useRef(false);

    // True only after the current trial's timing has started.
    const trialReady = useRef(false);

    // Browser timer IDs for stimulus visibility and response deadlines.
    const stimulusTimer = useRef<number | null>(null);
    const responseTimer = useRef<number | null>(null);

    // Controls the delay between feedback and the next trial.
    const feedbackTimer = useRef<number | null>(null);

    // Controls whether the word is visible.
    const [stimulusVisible, setStimulusVisible] = useState(true);

    // Current trial being displayed.
    const currentTrial = trials[currentTrialIndex];

    /**
     * Advance to the next trial after feedback.
     *
     * Shared by correct, incorrect and timeout outcomes.
   */
    function scheduleNextTrial() {
        // Cancel any previous pending transition.
        if (feedbackTimer.current !== null) {
            window.clearTimeout(feedbackTimer.current);
        }

        feedbackTimer.current = window.setTimeout(() => {
            feedbackTimer.current = null;

            // Lock responses while transitioning.
            trialReady.current = false;
            responseLocked.current = true;

            setFeedback(null);

            if (currentTrialIndex + 1 < trials.length) {
                setCurrentTrialIndex((previous) => previous + 1);
            } else {
                // Temporary until the results screen is implemented.
                setPhase("instructions");
            }
        }, 500);
    }


    /**
     * Record stimulus onset after React commits the
     * current trial to the interface.
     *
     * This replaces timestamps recorded before rendering.
     */

    useLayoutEffect(() => {
        if (phase !== "playing" || !currentTrial) {
            return;
        }

        // Prepare the newly displayed stimulus.
        setStimulusVisible(true);

        // Record approximate stimulus onset after React commits.
        trialStartTime.current = performance.now();

        // Allow responses for this trial.
        responseLocked.current = false;
        trialReady.current = true;

        // Hide the stimulus after its configured duration.
        stimulusTimer.current = window.setTimeout(() => {
            setStimulusVisible(false);
        }, defaultStroopConfig.stimulusDurationMs);

        // Automatically time out unanswered trials.
        responseTimer.current = window.setTimeout(() => {
            if (responseLocked.current) {
                return;
            }

            responseLocked.current = true;
            setStimulusVisible(false);
            setFeedback("timeout");

            // Advance using the shared transition function.
            scheduleNextTrial();
        }, defaultStroopConfig.responseWindowMs);

        return () => {
            // This trial is no longer accepting responses.
            trialReady.current = false;

            if (stimulusTimer.current !== null) {
                window.clearTimeout(stimulusTimer.current);
            }

            if (responseTimer.current !== null) {
                window.clearTimeout(responseTimer.current);
            }
        };
    }, [phase, currentTrial, currentTrialIndex, trials.length]);

    // Clean up pending feedback when the component unmounts.
    useEffect(() => {
        return () => {
            if (feedbackTimer.current !== null) {
                window.clearTimeout(feedbackTimer.current);
            }
        };
    }, []);

    function startGame() {
        // Generate a new randomized sequence of trials.
        const generatedTrials =
            generateStroopTrials(defaultStroopConfig);

        // Reset the game to the first trial.
        setTrials(generatedTrials);
        setCurrentTrialIndex(0);

        // Reset scores and feedback.
        setScore(0);
        setFeedback(null);
        setReactionTimes([]);

        // Allow responses for the new session.
        responseLocked.current = false;

        // Display the gameplay screen.
        setPhase("playing");
    }


    function handleResponse(selectedColor: string) {
        // Ignore responses when the game isn't active
        // or the current trial has already been answered.
        if (
            responseLocked.current ||
            !trialReady.current ||
            phase !== "playing" ||
            !currentTrial
        ) {
            return;
        }
        // Stop accepting responses once this trial is resolved.

        // Measure elapsed time from stimulus onset.
        const reactionTime =
            performance.now() - trialStartTime.current;

        // Reject responses received after the deadline.
        if (reactionTime >= defaultStroopConfig.responseWindowMs) {
            responseLocked.current = true;
            setStimulusVisible(false);

            // Cancel the pending timeout callback.
            if (responseTimer.current !== null) {
                window.clearTimeout(responseTimer.current);
            }

            if (stimulusTimer.current !== null) {
                window.clearTimeout(stimulusTimer.current);
            }

            setFeedback("timeout");
            scheduleNextTrial();
            return;
        }


        // Prevent multiple responses to the same trial.
        responseLocked.current = true;

        // Hide the stimulus once a response has been recorded.
        setStimulusVisible(false);

        // Stop the trial timers once a response is recorded.
        if (stimulusTimer.current !== null) {
            clearTimeout(stimulusTimer.current);
        }

        if (responseTimer.current !== null) {
            clearTimeout(responseTimer.current);
        }

        // Compare the selected colour against the ink colour.
        const isCorrect =
            selectedColor === currentTrial.correctResponse;

        // Record reaction time.
        setReactionTimes((previous) => [
            ...previous,
            reactionTime,
        ]);

        // Award points only for correct responses.
        if (isCorrect) {
            setScore((previous) => previous + 10);
        }

        // Display immediate feedback.
        setFeedback(isCorrect ? "correct" : "incorrect");

        // Advance using the same function as timeout trials.
        scheduleNextTrial();
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
                                width: `${(currentTrialIndex / trials.length) * 100
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
                                visibility: stimulusVisible ? "visible" : "hidden",
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
                                onClick={() => handleResponse(color)}
                                disabled={feedback !== null}
                                className="rounded-xl border-2 border-slate-200 bg-white p-5 font-semibold text-slate-800 transition-colors hover:border-blue-400 hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {color.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Immediate response feedback */}
                    <div className="min-h-8 text-center">
                        {feedback === "correct" && (
                            <p className="font-semibold text-green-600">
                                Correct! +10 points
                            </p>
                        )}

                        {feedback === "incorrect" && (
                            <p className="font-semibold text-red-600">
                                Incorrect - 0 points
                            </p>
                        )}

                        {feedback === "timeout" && (
                            <p className="font-semibold text-amber-600">
                                Time's up! 0 points
                            </p>
                        )}
                    </div>

                    {/* Current game points */}
                    <p className="text-center text-sm font-semibold text-blue-600">
                        Score: {score} points
                    </p>
                </div>
            )}
        </main>
    );
}
