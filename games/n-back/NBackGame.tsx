"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { defaultNBackConfig } from "./config";
import { generateNBackTrial, type NBackTrial } from "./logic";
import { createNBackTrialResult, validateNBackResults } from "./results";
import { calculateNBackMetrics } from "./statistics";
import NBackResults from "./NBackResults";
import type { NBackPosition, NBackTrialResult, SessionMetrics, SessionQualityFlag } from "../types";
import { submitNBackSession } from "@/lib/nback-sessions";

type Phase = "instructions" | "playing" | "results";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const positions: NBackPosition[] = ["top-left", "top-centre", "top-right", "middle-left", "centre", "middle-right", "bottom-left", "bottom-centre", "bottom-right"];

function formatCountdown(value: number) {
  const seconds = Math.ceil(value / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function NBackGame() {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [trials, setTrials] = useState<NBackTrial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [, setTrialResults] = useState<NBackTrialResult[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(defaultNBackConfig.sessionDurationMs);
  const [score, setScore] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [qualityFlags, setQualityFlags] = useState<SessionQualityFlag[]>([]);
  const trialStartMs = useRef(0);
  const sessionDeadlineMs = useRef<number | null>(null);
  const sessionStartedAt = useRef<string | null>(null);
  const sessionCompletedAt = useRef<string | null>(null);
  const submissionKey = useRef<string | null>(null);
  const responseLocked = useRef(true);
  const timeoutTimer = useRef<number | null>(null);
  const hideStimulusTimer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const saving = useRef(false);
  const completedResults = useRef<NBackTrialResult[]>([]);
  const currentTrial = trials[currentTrialIndex];

  const clearTimers = useCallback(() => {
    [timeoutTimer, hideStimulusTimer, advanceTimer, countdownTimer].forEach((timer) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    });
  }, []);

  const finishSession = useCallback((results: NBackTrialResult[]) => {
    if (!validateNBackResults(results) || results.length === 0) return;
    completedResults.current = results;
    const calculated = calculateNBackMetrics(results);
    setMetrics(calculated);
    sessionCompletedAt.current ??= new Date().toISOString();
    setPhase("results");
  }, []);

  const resolveTrial = useCallback((response: "match" | null) => {
    if (!currentTrial || responseLocked.current || phase !== "playing") return;
    responseLocked.current = true;
    if (timeoutTimer.current !== null) window.clearTimeout(timeoutTimer.current);
    const timestamp = response === "match" ? performance.now() : null;
    const result = createNBackTrialResult({ trial: currentTrial, response, stimulusOnsetMs: trialStartMs.current, responseTimestampMs: timestamp });
    const isCorrect = result.isCorrect;
    const nextResults = [...completedResults.current, result];
    completedResults.current = nextResults;
    setTrialResults(nextResults);
    const visualFeedback =
      result.responseType === "hit"
        ? "correct"
        : result.responseType === "correct-rejection"
          ? null
          : "incorrect";

    setFeedback(visualFeedback);
    if (isCorrect) setScore((previous) => previous + 10);
    if (visualFeedback !== null) {
      const feedbackDuration =
        visualFeedback === "correct"
          ? defaultNBackConfig.feedbackCorrectMs
          : defaultNBackConfig.feedbackIncorrectMs;

      window.setTimeout(() => setFeedback(null), feedbackDuration);
    }
  }, [currentTrial, phase]);

  useEffect(() => {
    if (phase !== "playing" || !currentTrial) return;
    const start = performance.now();
    trialStartMs.current = start;
    setStimulusVisible(true);
    responseLocked.current = false;
    timeoutTimer.current = window.setTimeout(() => resolveTrial(null), defaultNBackConfig.responseWindowMs);
    hideStimulusTimer.current = window.setTimeout(
      () => setStimulusVisible(false),
      defaultNBackConfig.responseWindowMs
    );
    advanceTimer.current = window.setTimeout(() => {
      const nextIndex = currentTrialIndex + 1;
      if ((sessionDeadlineMs.current ?? 0) <= performance.now()) {
        finishSession(completedResults.current);
        return;
      }
      setTrials((previous) => [...previous, generateNBackTrial(defaultNBackConfig, previous)]);
      setCurrentTrialIndex(nextIndex);
    }, defaultNBackConfig.stimulusDurationMs + defaultNBackConfig.interTrialIntervalMs);
    return () => {
      if (timeoutTimer.current !== null) window.clearTimeout(timeoutTimer.current);
      if (hideStimulusTimer.current !== null) window.clearTimeout(hideStimulusTimer.current);
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, [currentTrial, currentTrialIndex, finishSession, phase, resolveTrial]);

  useEffect(() => {
    if (phase !== "playing") return;
    const deadline = sessionDeadlineMs.current;
    if (deadline === null) return;
    countdownTimer.current = window.setInterval(() => setTimeRemainingMs(Math.max(0, deadline - performance.now())), 100);
    return () => { if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current); };
  }, [phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        resolveTrial("match");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolveTrial]);

  const saveCompletedSession = useCallback(async () => {
    if (!metrics || !sessionStartedAt.current || !sessionCompletedAt.current || !submissionKey.current || saving.current) return;
    saving.current = true;
    setSaveStatus("saving"); setSaveError(null);
    try {
      const saved = await submitNBackSession({ submissionKey: submissionKey.current, config: defaultNBackConfig, startedAt: sessionStartedAt.current, completedAt: sessionCompletedAt.current, metrics, trials: completedResults.current, gamePoints: score });
      setQualityFlags(saved.qualityFlags); setSaveStatus("saved");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Please try saving again."); setSaveStatus("error"); saving.current = false;
    }
  }, [metrics, score]);

  useEffect(() => { if (phase === "results" && saveStatus === "idle") void saveCompletedSession(); }, [phase, saveCompletedSession, saveStatus]);

  function startGame() {
    clearTimers();
    const firstTrial = generateNBackTrial(defaultNBackConfig, []);
    setTrials([firstTrial]); setCurrentTrialIndex(0); setTrialResults([]); completedResults.current = [];
    setMetrics(null); setFeedback(null); setScore(0); setSaveStatus("idle"); setSaveError(null); setQualityFlags([]); saving.current = false;
    sessionStartedAt.current = new Date().toISOString(); sessionCompletedAt.current = null; submissionKey.current = crypto.randomUUID();
    sessionDeadlineMs.current = performance.now() + defaultNBackConfig.sessionDurationMs; setTimeRemainingMs(defaultNBackConfig.sessionDurationMs);
    setPhase("playing");
  }

  const activeIndex =
    currentTrial && stimulusVisible
      ? positions.indexOf(currentTrial.stimulus)
      : -1;
  const getTileColor = (index: number) => {
    if (index !== activeIndex) {
      return "bg-slate-200";
    }

    if (feedback === "correct") {
      return "bg-green-500";
    }

    if (feedback === "incorrect") {
      return "bg-red-500";
    }

    return "bg-blue-600";
  };
  if (phase === "results" && metrics) return <main className="mx-auto max-w-2xl p-6 md:p-10"><NBackResults metrics={metrics} score={score} saveStatus={saveStatus} saveError={saveError} qualityFlags={qualityFlags} onRetrySave={() => { if (saveStatus === "error") void saveCompletedSession(); }} onPlayAgain={startGame} /></main>;

  return <main className="mx-auto max-w-2xl p-6 md:p-10">
    {phase === "instructions" ? <section className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"><div><p className="font-semibold text-blue-600">WORKING MEMORY</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Timed 2-Back</h1><p className="mt-2 text-slate-600">For 3 minutes, watch the blue position. Select Match only when it repeats the position from two trials ago.</p></div><ul className="space-y-2 text-sm text-slate-700"><li>• The first two positions are practice setup trials.</li><li>• Tap Match, press Space, or press Enter for a match.</li><li>• Correct responses flash green; incorrect responses flash red.</li><li>• Your scientific performance measures remain separate from Session Score.</li></ul><button type="button" onClick={startGame} className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Start 3-minute session</button></section> : <section className="space-y-6"><div className="flex items-end justify-between"><div><p className="font-semibold text-blue-600">TIMED 2-BACK</p><h1 className="text-3xl font-bold text-slate-900">{formatCountdown(timeRemainingMs)}</h1></div><p className="text-sm text-slate-500">Trial {currentTrialIndex + 1}</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600" style={{ width: `${((defaultNBackConfig.sessionDurationMs - timeRemainingMs) / defaultNBackConfig.sessionDurationMs) * 100}%` }} /></div><p className="text-center text-sm text-slate-600">Does this position match the one two trials ago?</p><div className="mx-auto grid aspect-square w-full max-w-sm grid-cols-3 grid-rows-3 gap-3" aria-label="N-Back position grid">{positions.map((position, index) => <div key={position} className={`flex items-center justify-center rounded-2xl transition-colors ${getTileColor(index)}`}>{index === activeIndex && <span className="h-6 w-6 rounded-full bg-white" />}</div>)}</div><button type="button" onClick={() => resolveTrial("match")} disabled={responseLocked.current} className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Match</button><p className="text-center text-sm text-slate-500">Wait for the next position when it is not a match.</p></section>}
  </main>;
}
