"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { defaultStroopConfig } from "./config";
import {
    generateStroopTrials,
    type StroopTrial,
} from "./logic";

import type {
    StroopTrialResult,
    SessionMetrics,
} from "../types";

import {
    createStroopTrialResult,
    validateStroopResults,
} from "./results";
import { calculateStroopMetrics } from "./statistics";

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

    // Store complete cognitive performance data for each trial.
    const [trialResults, setTrialResults] =
        useState<StroopTrialResult[]>([]);

    // Preserve cognitive performance metrics after session completion.
    const [sessionMetrics, setSessionMetrics] =
        useState<SessionMetrics | null>(null);

    // Track reaction time without causing re-renders.
    const trialStartTime = useRef<number>(0);

    // Prevent multiple responses to the same trial.
    const responseLocked = useRef(false);

    // True only after the current trial's timing has started.
    const trialReady = useRef(false);

    // Browser timer IDs for stimulus visibility and response deadlines.
    const stimulusTimer = useRef<number | null>(null);
    const responseTimer = useRef<number | null>(null);

    // Track pending animation frames for stimulus onset.
    const onsetFrame = useRef<number | null>(null);
    const presentationFrame = useRef<number | null>(null);

    // Controls the delay between feedback and the next trial.
    const feedbackTimer = useRef<number | null>(null);

    // Reference the stimulus element for precise visibility control.
    const stimulusRef = useRef<HTMLParagraphElement | null>(null);

    // Current trial being displayed.
    const currentTrial = trials[currentTrialIndex];

    // Validate and calculate metrics when all trials are recorded.
    useEffect(() => {
        if (
            phase !== "playing" ||
            trials.length === 0 ||
            trialResults.length !== trials.length
        ) {
            return;
        }

        const isValid = validateStroopResults(
            trialResults,
            trials.length
        );

        if (!isValid) {
            console.error(
                "Stroop session contains invalid trial results.",
                trialResults
            );
            return;
        }

        const metrics = calculateStroopMetrics(trialResults);

        setSessionMetrics(metrics);

        console.info("Stroop session metrics:", metrics);
    }, [phase, trials.length, trialResults]);

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

        // Capture the stimulus element for this trial.
        const stimulusElement = stimulusRef.current;

        // Keep responses locked until stimulus onset is scheduled.
        trialReady.current = false;
        responseLocked.current = true;

        // Keep the stimulus hidden while preparing the new trial.
        if (stimulusElement) {
            stimulusElement.style.visibility = "hidden";
        }

        // Schedule stimulus presentation through the browser's
        // animation-frame cycle.
        onsetFrame.current = window.requestAnimationFrame(() => {
            presentationFrame.current = window.requestAnimationFrame(() => {
                // Reveal the stimulus directly through the DOM.
                if (!stimulusElement) {
                    return;
                }

                stimulusElement.style.visibility = "visible";

                // Record approximate stimulus onset immediately after
                // updating the element's visibility.
                trialStartTime.current = performance.now();

                // Allow responses for this trial.
                responseLocked.current = false;
                trialReady.current = true;

                // Hide the stimulus after its configured duration.
                stimulusTimer.current = window.setTimeout(() => {
                    if (stimulusElement) {
                        stimulusElement.style.visibility = "hidden";
                    }
                }, defaultStroopConfig.stimulusDurationMs);

                // Automatically time out unanswered trials.
                responseTimer.current = window.setTimeout(() => {
                    if (responseLocked.current) {
                        return;
                    }

                    // Close the response window when the deadline expires.
                    responseLocked.current = true;
                    trialReady.current = false;
                    if (stimulusElement) {
                        stimulusElement.style.visibility = "hidden";
                    }

                    // Record an unanswered trial as a timeout.
                    const trialResult = createStroopTrialResult({
                        trial: currentTrial,
                        response: null,
                        stimulusOnsetMs: trialStartTime.current,
                        responseTimestampMs: null,
                    });

                    setTrialResults((previous) => [
                        ...previous,
                        trialResult,
                    ]);

                    setFeedback("timeout");

                    // Advance using the shared transition function.
                    scheduleNextTrial();
                }, defaultStroopConfig.responseWindowMs);
            });
        });

        return () => {
            // Prevent responses after this trial ends.
            trialReady.current = false;
            responseLocked.current = true;

            // Hide the stimulus when the trial is cleaned up.
            if (stimulusElement) {
                stimulusElement.style.visibility = "hidden";
            }

            // Cancel pending stimulus presentation frames.
            if (onsetFrame.current !== null) {
                window.cancelAnimationFrame(onsetFrame.current);
                onsetFrame.current = null;
            }

            if (presentationFrame.current !== null) {
                window.cancelAnimationFrame(presentationFrame.current);
                presentationFrame.current = null;
            }

            // Cancel stimulus visibility and response timers.
            if (stimulusTimer.current !== null) {
                window.clearTimeout(stimulusTimer.current);
                stimulusTimer.current = null;
            }

            if (responseTimer.current !== null) {
                window.clearTimeout(responseTimer.current);
                responseTimer.current = null;
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
        // Cancel any pending feedback transition from a previous session.
        if (feedbackTimer.current !== null) {
            window.clearTimeout(feedbackTimer.current);
            feedbackTimer.current = null;
        }

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
        setTrialResults([]);
        setSessionMetrics(null);

        // Keep responses disabled until the first stimulus is ready.
        trialReady.current = false;
        responseLocked.current = true;

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
            const trialResult = createStroopTrialResult({
                trial: currentTrial,
                response: null,
                stimulusOnsetMs: trialStartTime.current,
                responseTimestampMs: null,
            });

            setTrialResults((previous) => [
                ...previous,
                trialResult,
            ]);

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


        // Close the response window immediately.
        responseLocked.current = true;
        trialReady.current = false;

        // Hide the stimulus once a response has been recorded.
        if (stimulusRef.current) {
            stimulusRef.current.style.visibility = "hidden";
        }

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

        // Record the complete result for this trial.
        // Record the complete result for this trial.
        const trialResult = createStroopTrialResult({
            trial: currentTrial,
            response: selectedColor,
            stimulusOnsetMs: trialStartTime.current,
            responseTimestampMs: trialStartTime.current + reactionTime,
        });

        setTrialResults((previous) => [
            ...previous,
            trialResult,
        ]);

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
                            ref={stimulusRef}
                            className="invisible text-6xl font-extrabold"
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
