"use client";

import Link from "next/link";
import {
    Trophy,
    Target,
    Timer,
    CheckCircle2,
    RotateCcw,
} from "lucide-react";

import type { SessionMetrics } from "../types";

interface StroopResultsProps {
    metrics: SessionMetrics;
    score: number;
    onPlayAgain: () => void;
}

export default function StroopResults({
    metrics,
    score,
    onPlayAgain,
}: StroopResultsProps) {
    const additional = metrics.additionalMetrics;

    const formatMs = (value: number | null | undefined) =>
        value == null ? "N/A" : `${Math.round(value)} ms`;

    const formatPercent = (value: number | null | undefined) =>
        value == null ? "N/A" : `${value.toFixed(1)}%`;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-500" />

                <h1 className="text-3xl font-bold text-slate-900">
                    Training Complete!
                </h1>

                <p className="mt-2 text-slate-600">
                    You completed {metrics.totalTrials} Stroop trials.
                </p>
            </div>

            <div className="rounded-2xl bg-blue-600 p-6 text-center text-white">
                <p className="text-sm font-medium text-blue-100">
                    Game Points Earned
                </p>

                <p className="mt-2 text-5xl font-extrabold">
                    {score}
                </p>

                <p className="mt-2 text-sm text-blue-100">
                    +10 points per correct response
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <MetricCard
                    icon={<Target className="h-5 w-5 text-blue-600" />}
                    label="Accuracy"
                    value={formatPercent(metrics.accuracy)}
                />

                <MetricCard
                    icon={<Timer className="h-5 w-5 text-purple-600" />}
                    label="Average Reaction Time"
                    value={formatMs(metrics.meanReactionTimeMs)}
                />

                <MetricCard
                    icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                    label="Correct Answers"
                    value={`${metrics.correctTrials} / ${metrics.totalTrials}`}
                />

                <MetricCard
                    icon={<Timer className="h-5 w-5 text-amber-600" />}
                    label="Timeouts"
                    value={String(additional?.timeoutTrials ?? 0)}
                />
            </div>

            <div className="space-y-5 rounded-2xl border bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">
                    Cognitive Performance Breakdown
                </h2>

                <AccuracyBar
                    label="Congruent Accuracy"
                    value={additional?.congruentAccuracy}
                    color="bg-blue-500"
                />

                <AccuracyBar
                    label="Incongruent Accuracy"
                    value={additional?.incongruentAccuracy}
                    color="bg-purple-500"
                />

                <div className="border-t pt-4">
                    <div className="flex justify-between gap-4 text-sm">
                        <span className="text-slate-600">
                            Congruent Mean RT
                        </span>
                        <span className="font-semibold">
                            {formatMs(additional?.meanCongruentRT)}
                        </span>
                    </div>

                    <div className="mt-3 flex justify-between gap-4 text-sm">
                        <span className="text-slate-600">
                            Incongruent Mean RT
                        </span>
                        <span className="font-semibold">
                            {formatMs(additional?.meanIncongruentRT)}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between gap-4 border-t pt-4 text-sm">
                        <span className="font-semibold text-slate-800">
                            Stroop Interference
                        </span>
                        <span className="font-bold text-blue-600">
                            {formatMs(additional?.stroopInterferenceMs)}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-slate-500">
                    Reaction times are approximate browser-based
                    measurements. Interference is calculated as
                    incongruent minus congruent mean reaction time
                    for correct responses.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={onPlayAgain}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    <RotateCcw className="h-5 w-5" />
                    Play Again
                </button>

                <Link
                    href="/athlete/games"
                    className="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Back to Games
                </Link>
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border bg-white p-5">
            <div className="mb-3">{icon}</div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
}

function AccuracyBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number | null | undefined;
    color: string;
}) {
    const percentage = value ?? 0;

    return (
        <div>
            <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold">
                    {value == null ? "N/A" : `${value.toFixed(1)}%`}
                </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                    }}
                />
            </div>
        </div>
    );
}
