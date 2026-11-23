import { Flame, Target, Zap } from "lucide-react";
import Link from "next/link";

import { StatsCard } from "@/components/athlete/stats-card";
import { DailyGoal } from "@/components/athlete/daily-goal";
import { GameCard } from "@/components/athlete/game-card";
import {
  getAthleteDashboardData,
} from "@/lib/athlete-dashboard";
import { mockGames } from "@/lib/mock-data";

export default async function AthleteDashboard() {
  const dashboard = await getAthleteDashboardData();

  return (
    <section className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="mb-8">
        <p className="mb-2 font-semibold text-blue-600">
          BET TRAINING
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back!
        </h1>

        <p className="mt-2 text-slate-500">
          Ready to sharpen your mind today?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total XP"
          value={`${dashboard.totalXp} XP`}
          icon={Zap}
          color="blue"
        />

        <StatsCard
          title="Current Streak"
          value={`${dashboard.currentStreak} ${
            dashboard.currentStreak === 1 ? "day" : "days"
          }`}
          icon={Flame}
          color="orange"
        />

        <StatsCard
          title="Sessions Today"
          value={dashboard.gamesCompletedToday}
          icon={Target}
          color="purple"
        />

        <StatsCard
          title="Daily Goal"
          value={`${dashboard.dailyGoal} sessions`}
          icon={Target}
          color="blue"
        />
      </div>

      <div className="mt-8">
        <DailyGoal
          completed={dashboard.gamesCompletedToday}
          goal={dashboard.dailyGoal}
        />
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Cognitive Games
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Challenge yourself with cognitive training tasks.
            </p>
          </div>

          <Link
            href="/athlete/games"
            className="shrink-0 font-semibold text-blue-600 hover:text-blue-700"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {mockGames.slice(0, 2).map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}

