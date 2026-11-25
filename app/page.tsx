import Link from "next/link";
import {
  BrainCircuit,
  ChartNoAxesCombined,
  Clock3,
  Target,
} from "lucide-react";

const prototypeFeatures = [
  {
    icon: Clock3,
    title: "Timed cognitive tasks",
    description:
      "Train with fixed 3-minute Stroop and visual-position 2-Back sessions.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Task-specific progress",
    description:
      "Review saved sessions and trends without comparing different tasks or protocols.",
  },
  {
    icon: Target,
    title: "Transparent context",
    description:
      "See data-quality notes alongside your results without altering your recorded values.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-bold text-slate-900">
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <BrainCircuit className="h-6 w-6" />
            </span>
            BET Training
          </div>

          <Link
            href="/auth/login"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-100"
          >
            Sign in
          </Link>
        </nav>

        <section className="grid gap-10 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-semibold text-blue-600">
              COGNITIVE TRAINING PROTOTYPE
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Build a consistent cognitive-training practice.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              BET Training is a browser-based capstone prototype with timed
              Stroop and visual-position 2-Back tasks, task-specific progress,
              and clear data-quality context.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/sign-up"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Create an account
              </Link>
              <Link
                href="/auth/login"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Sign in to train
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border bg-white p-6 shadow-sm">
            <BrainCircuit className="h-12 w-12 text-blue-600" />
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              v1.0 prototype
            </h2>
            <p className="mt-3 text-slate-600">
              Cognitive measures and gamification values are shown separately.
            </p>
            <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-950">
              For training and demonstration only. This prototype is not a
              clinical or diagnostic assessment tool.
            </p>
          </aside>
        </section>

        <section className="grid gap-5 pb-16 md:grid-cols-3">
          {prototypeFeatures.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <Icon className="h-7 w-7 text-blue-600" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
