"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    Clock3,
    Target,
    Timer,
    TriangleAlert,
    Trophy,
} from "lucide-react";

import type { SessionQualityFlag } from "@/games/types";
import type {
    StroopSessionHistoryItem,
} from "@/lib/cognitive-session-history";
import { getSessionQualityNote } from "@/lib/session-quality-notes";
import {
    filterStroopSessions,
    getStroopTrendPoints,
    getStroopTrendSummary,
    getStroopTrendTimelineLabels,
    type StroopProtocolFilter,
    type StroopTrendMetric,
} from "@/lib/stroop-session-trends";
import {
    getStroopProtocolLabel,
    getTimedProtocolDurationLabel,
    isTimedStroopProtocol,
} from "@/lib/stroop-session-history-formatters";

const trendMetricLabels: Record<
    StroopTrendMetric,
    string
> = {
    accuracy: "Accuracy",
    meanReactionTimeMs: "Average RT",
    stroopInterferenceMs: "Stroop interference",
};

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-SG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Singapore",
    }).format(new Date(value));
}

function formatShortDate(value: string) {
    return new Intl.DateTimeFormat("en-SG", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Singapore",
    }).format(new Date(value));
}

function formatPercentage(value: number | null) {
    return value === null ? "N/A" : `${value.toFixed(1)}%`;
}

function formatMilliseconds(value: number | null) {
    return value === null
        ? "N/A"
        : `${Math.round(value)} ms`;
}

function formatTrendValue(
    value: number,
    metric: StroopTrendMetric
) {
    return metric === "accuracy"
        ? `${value.toFixed(1)}%`
        : `${Math.round(value)} ms`;
}

function SessionMetric({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
}

function SessionQualityNotes({
    qualityFlags,
}: {
    qualityFlags: SessionQualityFlag[];
}) {
    if (qualityFlags.length === 0) {
        return null;
    }

    return (
        <section
            aria-label="Data-quality notes"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
            <div className="flex gap-3">
                <TriangleAlert className="h-5 w-5 shrink-0 text-amber-700" />

                <div>
                    <h3 className="font-semibold">
                        Data-quality notes
                    </h3>

                    <ul className="mt-2 space-y-3">
                        {qualityFlags.map((flag) => {
                            const note = getSessionQualityNote(flag.code);

                            return (
                                <li key={flag.code}>
                                    <p className="font-medium">{note.title}</p>

                                    <p className="mt-1 text-amber-900">
                                        {note.description}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>

                    <p className="mt-3 text-xs text-amber-800">
                        These notes provide interpretation context only.
                        They do not change raw results, Session Score, XP,
                        streaks, or daily goals.
                    </p>
                </div>
            </div>
        </section>
    );
}

function StroopSessionCard({
    session,
}: {
    session: StroopSessionHistoryItem;
}) {
    const correctAnswers =
        session.correctTrials !== null &&
            session.totalTrials !== null
            ? `${session.correctTrials} / ${session.totalTrials}`
            : "N/A";

    const protocolLabel = getStroopProtocolLabel(
        session.configVersion
    );

    const isTimedProtocol = isTimedStroopProtocol(
        session.configVersion
    );

    const durationLabel = getTimedProtocolDurationLabel(
        session.configVersion,
        session.config
    );

    return (
        <article className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            STROOP
                        </span>

                        <span className="text-sm font-medium text-green-700">
                            Completed
                        </span>
                    </div>

                    <p className="mt-3 text-base font-bold text-slate-900">
                        {protocolLabel}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {formatDateTime(session.completedAt)}
                    </p>
                </div>

                <div className="rounded-xl bg-blue-600 px-4 py-3 text-center text-white">
                    <p className="text-xs font-medium text-blue-100">
                        Session Score
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                        {session.gamePoints}
                    </p>
                </div>
            </div>

            <section
                aria-label="Session context"
                className="mt-5 rounded-xl bg-slate-50 p-4"
            >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Session context
                </p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <SessionMetric
                        label="Protocol"
                        value={protocolLabel}
                    />

                    {durationLabel !== null && (
                        <SessionMetric
                            label="Session duration"
                            value={durationLabel}
                        />
                    )}

                    {isTimedProtocol && (
                        <SessionMetric
                            label="Completed trials"
                            value={
                                session.totalTrials === null
                                    ? "N/A"
                                    : String(session.totalTrials)
                            }
                        />
                    )}
                </div>
            </section>

            <section
                aria-label="Cognitive performance"
                className="mt-5 border-t pt-5"
            >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Cognitive performance
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SessionMetric
                        label="Accuracy"
                        value={formatPercentage(session.accuracy)}
                    />

                    <SessionMetric
                        label="Average RT"
                        value={formatMilliseconds(
                            session.meanReactionTimeMs
                        )}
                    />

                    <SessionMetric
                        label="Correct"
                        value={correctAnswers}
                    />

                    <SessionMetric
                        label="Timeouts"
                        value={
                            session.timeoutTrials === null
                                ? "N/A"
                                : String(session.timeoutTrials)
                        }
                    />
                </div>
            </section>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <Timer className="h-4 w-4 text-purple-600" />

                <span className="text-slate-600">
                    Stroop interference
                </span>

                <span className="ml-auto font-bold text-slate-900">
                    {formatMilliseconds(
                        session.stroopInterferenceMs
                    )}
                </span>
            </div>

            <SessionQualityNotes
                qualityFlags={session.qualityFlags}
            />
        </article>
    );
}

function TrendGraph({
    sessions,
    protocol,
    metric,
}: {
    sessions: StroopSessionHistoryItem[];
    protocol: Exclude<StroopProtocolFilter, "all">;
    metric: StroopTrendMetric;
}) {
    const points = getStroopTrendPoints(
        sessions,
        protocol,
        metric
    );

    const summary = getStroopTrendSummary(metric, points);

    const timelineLabels = new Map(
        getStroopTrendTimelineLabels(points).map((label) => [
            label.id,
            label,
        ])
    );

    const hasQualityFlaggedPoints = points.some(
        (point) => point.hasQualityFlags
    );

    if (summary === null) {
        return (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                Complete one more session with this protocol to see
                a trend.
            </div>
        );
    }

    const values = points.map((point) => point.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;
    const chartWidth = 640;
    const chartHeight = 280;
    const leftPadding = 66;
    const rightPadding = 24;
    const topPadding = 24;
    const bottomPadding = 48;
    const graphWidth =
        chartWidth - leftPadding - rightPadding;
    const graphHeight =
        chartHeight - topPadding - bottomPadding;

    const getX = (index: number) =>
        leftPadding +
        (graphWidth * index) / (points.length - 1);

    const getY = (value: number) =>
        topPadding +
        graphHeight -
        ((value - minimum) / range) * graphHeight;

    const linePoints = points
        .map(
            (point, index) =>
                `${getX(index)},${getY(point.value)}`
        )
        .join(" ");

    const toneClass =
        summary.tone === "good"
            ? "text-green-700"
            : summary.tone === "bad"
                ? "text-red-700"
                : "text-slate-700";

    const protocolLabel = getStroopProtocolLabel(protocol);

    return (
        <div className="mt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Change from first session shown
                    </p>

                    <p
                        className={`mt-1 text-2xl font-extrabold ${toneClass}`}
                    >
                        {summary.displayValue}
                    </p>
                </div>

                <p className="text-sm text-slate-500">
                    {trendMetricLabels[metric]} · {protocolLabel}
                </p>
            </div>

            <p className="mt-2 text-sm text-slate-500">
                Showing the latest 10 saved sessions for this protocol.
            </p>

            <div className="mt-5 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-72 min-w-[640px] w-full"
                    role="img"
                    aria-label={`${trendMetricLabels[metric]} trend for ${protocolLabel}`}
                >
                    <title>
                        {trendMetricLabels[metric]} trend
                    </title>

                    <desc>
                        Values are shown from the earliest to latest
                        session. Amber points have data-quality notes.
                    </desc>

                    {[maximum, (maximum + minimum) / 2, minimum].map(
                        (value) => (
                            <g key={value}>
                                <line
                                    x1={leftPadding}
                                    x2={chartWidth - rightPadding}
                                    y1={getY(value)}
                                    y2={getY(value)}
                                    stroke="#e2e8f0"
                                />

                                <text
                                    x={leftPadding - 12}
                                    y={getY(value) + 4}
                                    textAnchor="end"
                                    className="fill-slate-500 text-xs"
                                >
                                    {formatTrendValue(value, metric)}
                                </text>
                            </g>
                        )
                    )}

                    <line
                        x1={leftPadding}
                        x2={leftPadding}
                        y1={topPadding}
                        y2={chartHeight - bottomPadding}
                        stroke="#94a3b8"
                    />

                    <line
                        x1={leftPadding}
                        x2={chartWidth - rightPadding}
                        y1={chartHeight - bottomPadding}
                        y2={chartHeight - bottomPadding}
                        stroke="#94a3b8"
                    />

                    <polyline
                        fill="none"
                        points={linePoints}
                        stroke="#2563eb"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                    />

                    {points.map((point, index) => (
                        <g key={point.id}>
                            <circle
                                cx={getX(index)}
                                cy={getY(point.value)}
                                fill={
                                    point.hasQualityFlags
                                        ? "#d97706"
                                        : "#2563eb"
                                }
                                r={point.hasQualityFlags ? 7 : 5}
                            >
                                <title>
                                    {`${formatShortDate(
                                        point.completedAt
                                    )}: ${formatTrendValue(
                                        point.value,
                                        metric
                                    )}${point.hasQualityFlags
                                        ? " (data-quality context)"
                                        : ""
                                        }`}
                                </title>
                            </circle>

                            <text
                                x={getX(index)}
                                y={chartHeight - 20}
                                textAnchor="middle"
                                className="fill-slate-500 text-xs"
                            >
                                {timelineLabels.get(point.id)?.graphLabel ??
                                    formatShortDate(point.completedAt)}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {hasQualityFlaggedPoints && (
                <div className="mt-4 flex items-start gap-2 text-sm text-slate-600">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                    <p>
                        Amber points have data-quality context. Values are
                        shown without alteration.
                    </p>
                </div>
            )}

            <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <caption className="sr-only">
                        Exact values in this trend
                    </caption>

                    <thead className="border-b text-slate-500">
                        <tr>
                            <th className="px-3 py-2 font-medium">
                                Session
                            </th>

                            <th className="px-3 py-2 font-medium">
                                {trendMetricLabels[metric]}
                            </th>

                            <th className="px-3 py-2 font-medium">
                                Context
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {points.map((point) => (
                            <tr
                                key={point.id}
                                className="border-b last:border-0"
                            >
                                <td className="px-3 py-2">
                                    {timelineLabels.get(point.id)?.tableLabel ??
                                        formatDateTime(point.completedAt)}
                                </td>

                                <td className="px-3 py-2 font-medium">
                                    {formatTrendValue(point.value, metric)}
                                </td>

                                <td className="px-3 py-2">
                                    {point.hasQualityFlags
                                        ? "Data-quality context"
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ProgressExplorer({
    sessions,
}: {
    sessions: StroopSessionHistoryItem[];
}) {
    const [protocol, setProtocol] =
        useState<StroopProtocolFilter>("all");

    const [metric, setMetric] =
        useState<StroopTrendMetric>("accuracy");

    const filteredSessions = useMemo(
        () => filterStroopSessions(sessions, protocol),
        [protocol, sessions]
    );

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Session trends
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            A descriptive view of sessions within one
                            recorded protocol.
                        </p>
                    </div>

                    <label className="text-sm font-medium text-slate-700">
                        Metric
                        <select
                            value={metric}
                            disabled={protocol === "all"}
                            onChange={(event) =>
                                setMetric(
                                    event.target.value as StroopTrendMetric
                                )
                            }
                            className="mt-1 block rounded-lg border bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                            <option value="accuracy">Accuracy</option>

                            <option value="meanReactionTimeMs">
                                Average RT
                            </option>

                            <option value="stroopInterferenceMs">
                                Stroop interference
                            </option>
                        </select>
                    </label>
                </div>

                <div className="mt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Protocol
                    </p>

                    <div
                        className="mt-2 flex flex-wrap gap-2"
                        role="group"
                        aria-label="Protocol filter"
                    >
                        {(
                            [
                                ["all", "All sessions"],
                                ["2.0.0", "3-minute timed Stroop"],
                                ["1.0.0", "40-trial Stroop"],
                            ] as const
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={protocol === value}
                                onClick={() => setProtocol(value)}
                                className={
                                    protocol === value
                                        ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                                        : "rounded-full border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {protocol === "all" ? (
                    <div className="mt-5 rounded-xl bg-blue-50 p-5 text-sm text-blue-900">
                        <p className="font-semibold">
                            Select one protocol to view trends
                        </p>

                        <p className="mt-1">
                            Results are not compared across protocol
                            versions.
                        </p>
                    </div>
                ) : (
                    <TrendGraph
                        sessions={sessions}
                        protocol={protocol}
                        metric={metric}
                    />
                )}
            </section>

            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">
                    Recent Training Sessions
                </h2>

                <p className="text-sm text-slate-500">
                    Showing {filteredSessions.length} session
                    {filteredSessions.length === 1 ? "" : "s"}
                </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Sessions are shown in their recorded protocols.
                Cognitive results are not compared or ranked across
                protocol versions.
            </div>

            {filteredSessions.map((session) => (
                <StroopSessionCard
                    key={session.id}
                    session={session}
                />
            ))}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex gap-3">
                    <Trophy className="h-5 w-5 shrink-0 text-purple-600" />

                    <p>
                        Reaction-time values are approximate
                        browser-based measurements. Stroop interference
                        is the average correct incongruent reaction time
                        minus the average correct congruent reaction time.
                    </p>
                </div>
            </div>
        </div>
    );
}

export function EmptyProgressState() {
    return (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
            <Target className="mx-auto h-12 w-12 text-blue-600" />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
                No Stroop sessions yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-500">
                Complete a Stroop training session to start building
                your performance history.
            </p>

            <Link
                href="/athlete/games/stroop"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
                Start Stroop Training
            </Link>
        </div>
    );
}