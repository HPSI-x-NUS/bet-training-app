"use client";

import Link from "next/link";
import { BrainCircuit, CheckCircle2, RotateCcw } from "lucide-react";

import type { SessionMetrics, SessionQualityFlag } from "../types";

interface NBackResultsProps {
  metrics: SessionMetrics;
  score: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  qualityFlags: SessionQualityFlag[];
  onRetrySave: () => void;
  onPlayAgain: () => void;
}

function formatPercentage(value: number | null | undefined) {
  return value === null || value === undefined ? "N/A" : `${(value * 100).toFixed(1)}%`;
}

function formatMilliseconds(value: number | null | undefined) {
  return value === null || value === undefined ? "N/A" : `${Math.round(value)} ms`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function NBackResults({
  metrics,
  score,
  saveStatus,
  saveError,
  qualityFlags,
  onRetrySave,
  onPlayAgain,
}: NBackResultsProps) {
  const additional = metrics.additionalMetrics;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <BrainCircuit className="mx-auto mb-3 h-12 w-12 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-900">Training Complete!</h1>
        <p className="mt-2 text-slate-600">
          You completed {metrics.totalTrials} timed 2-back trials.
        </p>
      </div>

      <div className="rounded-2xl bg-blue-600 p-6 text-center text-white">
        <p className="text-sm font-medium text-blue-100">Session Score</p>
        <p className="mt-2 text-5xl font-extrabold">{score}</p>
        <p className="mt-2 text-sm text-blue-100">Gamification points are separate from cognitive measures.</p>
      </div>

      <section aria-label="Cognitive performance" className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Cognitive Performance</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Accuracy" value={`${metrics.accuracy.toFixed(1)}%`} />
          <MetricCard label="Hits" value={`${additional?.hits ?? 0} / ${additional?.targetTrials ?? 0}`} />
          <MetricCard label="False alarms" value={String(additional?.falseAlarms ?? 0)} />
          <MetricCard label="Average hit RT" value={formatMilliseconds(metrics.meanReactionTimeMs)} />
        </div>
        <div className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
          <div><p className="text-slate-500">Hit rate</p><p className="font-semibold">{formatPercentage(additional?.hitRate)}</p></div>
          <div><p className="text-slate-500">False-alarm rate</p><p className="font-semibold">{formatPercentage(additional?.falseAlarmRate)}</p></div>
          <div><p className="text-slate-500">d-prime</p><p className="font-semibold">{additional?.dPrime?.toFixed(2) ?? "N/A"}</p></div>
        </div>
        <p className="text-xs text-slate-500">
          d-prime is a descriptive sensitivity measure calculated from corrected hit and false-alarm rates. Browser reaction times are approximate.
        </p>
      </section>

      {saveStatus === "saved" && qualityFlags.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Data-quality notes</p>
          <p className="mt-1">This session includes saved context notes. They do not change raw results, Session Score, XP, streaks, or goals.</p>
        </section>
      )}

      <div aria-live="polite" className="rounded-xl border bg-white p-4 text-sm">
        {saveStatus === "saving" && <p className="text-slate-600">Saving your training session…</p>}
        {saveStatus === "saved" && <p className="font-medium text-green-700">Training session saved successfully.</p>}
        {saveStatus === "error" && (
          <div className="space-y-3">
            <p className="text-red-600">Your results are visible but could not be saved. {saveError}</p>
            <button type="button" onClick={onRetrySave} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50">Retry Saving</button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onPlayAgain} disabled={saveStatus === "saving"} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <RotateCcw className="h-5 w-5" /> Play Again
        </button>
        <Link href="/athlete/games" className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
          <CheckCircle2 className="h-5 w-5" /> Back to Games
        </Link>
      </div>
    </div>
  );
}
