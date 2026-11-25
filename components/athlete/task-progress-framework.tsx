"use client";

import { useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import type { CognitiveHistorySession } from "@/cognitive-history/types";
import { getSessionQualityNote } from "@/lib/session-quality-notes";

type TimeRangeId = "week" | "month" | "quarter" | "all";

export interface TaskMetric<T extends CognitiveHistorySession> {
  id: string;
  label: string;
  value: (session: T) => number | null;
  format: (value: number) => string;
  favourable: "higher" | "lower";
}

export interface CardMetric<T extends CognitiveHistorySession> {
  label: string;
  value: (session: T) => string;
}

interface TaskProgressFrameworkProps<T extends CognitiveHistorySession> {
  taskLabel: string;
  trendProtocolLabel: string;
  sessions: T[];
  trendMetrics: TaskMetric<T>[];
  cardMetrics: CardMetric<T>[];
  getSessionProtocolLabel: (session: T) => string;
  isTrendEligible?: (session: T) => boolean;
  renderSessionContext?: (session: T) => ReactNode;
  footer?: ReactNode;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-SG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Singapore",
});

const timeRanges: { id: TimeRangeId; label: string; days: number | null }[] = [
  { id: "week", label: "Last 7 days", days: 7 },
  { id: "month", label: "Last month", days: 30 },
  { id: "quarter", label: "Last 3 months", days: 90 },
  { id: "all", label: "All time", days: null },
];

function SessionQualityNotes({ session }: { session: CognitiveHistorySession }) {
  if (session.qualityFlags.length === 0) return null;

  return (
    <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" aria-label="Data-quality notes">
      <div className="flex gap-3">
        <TriangleAlert className="h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h3 className="font-semibold">Data-quality notes</h3>
          <ul className="mt-2 space-y-3">
            {session.qualityFlags.map((flag) => {
              const note = getSessionQualityNote(flag.code);
              return <li key={flag.code}><p className="font-medium">{note.title}</p><p className="mt-1 text-amber-900">{note.description}</p></li>;
            })}
          </ul>
          <p className="mt-3 text-xs text-amber-800">These notes provide interpretation context only. They do not change raw results, Session Score, XP, streaks, or daily goals.</p>
        </div>
      </div>
    </section>
  );
}

export function TaskProgressFramework<T extends CognitiveHistorySession>({
  taskLabel, trendProtocolLabel, sessions, trendMetrics, cardMetrics, getSessionProtocolLabel,
  isTrendEligible = () => true, renderSessionContext, footer,
}: TaskProgressFrameworkProps<T>) {
  const [metricId, setMetricId] = useState(trendMetrics[0].id);
  const [rangeId, setRangeId] = useState<TimeRangeId>("quarter");
  const metric = trendMetrics.find((item) => item.id === metricId) ?? trendMetrics[0];
  const selectedRange = timeRanges.find((range) => range.id === rangeId) ?? timeRanges[2];
  const cutoff = selectedRange.days === null ? null : Date.now() - selectedRange.days * 86_400_000;
  const rangeSessions = sessions.filter((session) => cutoff === null || new Date(session.completedAt).getTime() >= cutoff);
  const points = [...rangeSessions].reverse().filter(isTrendEligible).flatMap((session) => {
    const value = metric.value(session);
    return value === null ? [] : [{ session, value }];
  });
  const change = points.length > 1 ? points.at(-1)!.value - points[0].value : null;
  const isGoodChange = change !== null && (metric.favourable === "higher" ? change > 0 : change < 0);
  const isBadChange = change !== null && !isGoodChange && change !== 0;
  const values = points.map((point) => point.value);
  const minimum = values.length === 0 ? 0 : Math.min(...values);
  const maximum = values.length === 0 ? 1 : Math.max(...values);
  const valueRange = maximum - minimum || 1;
  const x = (index: number) => 68 + (548 * index) / Math.max(1, points.length - 1);
  const y = (value: number) => 24 + 204 - ((value - minimum) / valueRange) * 204;

  return <div className="space-y-5">
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold">Session trends</h2><p className="mt-1 text-sm text-slate-500">{trendProtocolLabel} · descriptive only</p></div>
        <label className="text-sm font-medium">Metric<select value={metric.id} onChange={(event) => setMetricId(event.target.value)} className="mt-1 block rounded-lg border px-3 py-2">{trendMetrics.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Time range">
        {timeRanges.map((range) => <button key={range.id} type="button" aria-pressed={rangeId === range.id} onClick={() => setRangeId(range.id)} className={rangeId === range.id ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"}>{range.label}</button>)}
      </div>
      {points.length < 2 ? <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Complete one more comparable session in this time range to see a trend.</p> : <>
        <div className="mt-5"><p className="text-xs font-medium uppercase text-slate-500">Change from first session shown</p><p className={`mt-1 text-2xl font-extrabold ${isGoodChange ? "text-green-700" : isBadChange ? "text-red-700" : "text-slate-700"}`}>{change! >= 0 ? "+" : ""}{metric.format(change!)}</p></div>
        <div className="mt-5 overflow-x-auto"><svg viewBox="0 0 640 280" className="h-72 min-w-[640px] w-full" role="img" aria-label={`${metric.label} trend for ${trendProtocolLabel}`}><line x1="68" x2="616" y1="228" y2="228" stroke="#94a3b8" /><polyline fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")} />{points.map((point, index) => <circle key={point.session.id} cx={x(index)} cy={y(point.value)} r={point.session.qualityFlags.length > 0 ? 7 : 5} fill={point.session.qualityFlags.length > 0 ? "#d97706" : "#2563eb"}><title>{`${dateTimeFormatter.format(new Date(point.session.completedAt))}: ${metric.format(point.value)}${point.session.qualityFlags.length > 0 ? " (data-quality context)" : ""}`}</title></circle>)}</svg></div>
        {points.some((point) => point.session.qualityFlags.length > 0) && <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><TriangleAlert className="h-4 w-4 text-amber-600" />Amber points have data-quality context. Values are shown without alteration.</p>}
        <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><caption className="sr-only">Exact values in this trend</caption><thead className="border-b text-slate-500"><tr><th className="px-3 py-2 font-medium">Session</th><th className="px-3 py-2 font-medium">{metric.label}</th><th className="px-3 py-2 font-medium">Context</th></tr></thead><tbody>{points.map(({ session, value }) => <tr key={session.id} className="border-b last:border-0"><td className="px-3 py-2">{dateTimeFormatter.format(new Date(session.completedAt))}</td><td className="px-3 py-2 font-medium">{metric.format(value)}</td><td className="px-3 py-2">{session.qualityFlags.length > 0 ? "Data-quality context" : "—"}</td></tr>)}</tbody></table></div>
      </>}
    </section>
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Recent Training Sessions</h2><p className="text-sm text-slate-500">Showing {rangeSessions.length} session{rangeSessions.length === 1 ? "" : "s"}</p></div>
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Sessions are shown in their recorded protocols. Cognitive results are not compared or ranked across tasks or protocol versions.</div>
    {rangeSessions.map((session) => <article key={session.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{taskLabel.toUpperCase()}</span><span className="text-sm font-medium text-green-700">Completed</span></div><p className="mt-3 font-bold">{getSessionProtocolLabel(session)}</p><p className="mt-2 text-sm text-slate-500">{dateTimeFormatter.format(new Date(session.completedAt))}</p></div><div className="rounded-xl bg-blue-600 px-4 py-3 text-center text-white"><p className="text-xs">Session Score</p><p className="text-2xl font-bold">{session.gamePoints}</p></div></div>{renderSessionContext?.(session)}<div className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-4">{cardMetrics.map((item) => <div key={item.label}><p className="text-sm text-slate-500">{item.label}</p><p className="font-bold">{item.value(session)}</p></div>)}</div><SessionQualityNotes session={session} /></article>)}
    {footer}
  </div>;
}
