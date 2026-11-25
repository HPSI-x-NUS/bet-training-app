import Link from "next/link";
import { Target } from "lucide-react";

export function EmptyProgressState() {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
      <Target className="mx-auto h-12 w-12 text-blue-600" />
      <h2 className="mt-5 text-xl font-bold text-slate-900">No cognitive sessions yet</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-500">Complete a cognitive training session to start building your performance history.</p>
      <Link href="/athlete/games" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Explore cognitive games</Link>
    </div>
  );
}
