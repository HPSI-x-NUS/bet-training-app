
import { Target } from "lucide-react";

interface DailyGoalProps {
  completed: number;
  goal: number;
}

export function DailyGoal({
  completed,
  goal,
}: DailyGoalProps) {
  const progress =
    goal > 0
      ? Math.min(100, Math.max(0, (completed / goal) * 100))
      : 0;

  const goalReached = goal > 0 && completed >= goal;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-green-50 p-3 text-green-600">
          <Target size={24} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daily Training Goal
          </h2>
          <p className="text-sm text-slate-500">
            Build consistency, one session at a time.
          </p>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          Today's progress
        </span>

        <span className="text-sm font-bold text-green-600">
          {completed} / {goal} games
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Daily training progress"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(completed, goal)}
        className="h-3 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {goalReached
          ? "Amazing work! You've reached your daily goal!"
          : `Complete ${Math.max(0, goal - completed)} more game(s) to reach your goal!`}
      </p>
    </div>
  );
}
