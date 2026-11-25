import {
  EmptyProgressState,
  ProgressExplorer,
} from "@/components/athlete/progress-explorer";
import { getStroopSessionHistory } from "@/lib/cognitive-session-history";

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
          Review your completed cognitive training sessions.
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyProgressState />
      ) : (
        <ProgressExplorer sessions={sessions} />
      )}
    </section>
  );
}
