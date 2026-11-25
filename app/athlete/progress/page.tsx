import Link from "next/link";
import {
  Clock3,
  Target,
  Timer,
  Trophy,
} from "lucide-react";

import {
  getStroopSessionHistory,
  type StroopSessionHistoryItem,
} from "@/lib/cognitive-session-history";
import {
  getStroopProtocolLabel,
  getTimedProtocolDurationLabel,
  isTimedStroopProtocol,
} from "@/lib/stroop-session-history-formatters";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
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
    </article>
  );
}

export default async function ProgressPage() {
  const sessions = await getStroopSessionHistory();

  return (
    <section className="mx-auto max-w-5xl p-6 md:p-10">
      <div className="mb-8">
        <p className="mb-2 font-semibold text-blue-600">
          COGNITIVE PERFORMANCE
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          My Progress
        </h1>

        <p className="mt-2 text-slate-500">
          Review your completed Stroop training sessions.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <Target className="mx-auto h-12 w-12 text-blue-600" />

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            No Stroop sessions yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Complete a Stroop training session to start
            building your performance history.
          </p>

          <Link
            href="/athlete/games/stroop"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Start Stroop Training
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">
              Recent Stroop Sessions
            </h2>

            <p className="text-sm text-slate-500">
              Showing your latest {sessions.length} session
              {sessions.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Sessions are shown in their recorded protocols.
            Cognitive results are not compared or ranked across
            protocol versions.
          </div>

          {sessions.map((session) => (
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
                browser-based measurements. Stroop
                interference is the average correct
                incongruent reaction time minus the average
                correct congruent reaction time.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}