import { requireRole } from "@/lib/auth";
import {
  calculateStreakMetrics,
  getSingaporeDayKey,
} from "@/lib/athlete-streaks";
import { createClient } from "@/lib/supabase/server";

const DAILY_SESSION_GOAL = 3;

export async function getAthleteDashboardData() {
  const user = await requireRole("athlete");
  const supabase = await createClient();

  const [
    gamificationResult,
    completedSessionsResult,
  ] = await Promise.all([
    supabase
      .from("athlete_gamification")
      .select("total_xp")
      .eq("athlete_id", user.id)
      .maybeSingle(),

    supabase
      .from("cognitive_game_sessions")
      .select("completed_at")
      .eq("athlete_id", user.id)
      .eq("status", "completed"),
  ]);

  if (gamificationResult.error) {
    throw new Error(
      `Unable to load your XP: ${gamificationResult.error.message}`
    );
  }

  if (completedSessionsResult.error) {
    throw new Error(
      "Unable to load completed sessions: " +
        completedSessionsResult.error.message
    );
  }

  const completedAt = completedSessionsResult.data
    .flatMap((session) =>
      session.completed_at === null
        ? []
        : [session.completed_at]
    );

  const todayKey = getSingaporeDayKey(new Date());

  const gamesCompletedToday = completedAt.filter(
    (completedAtValue) =>
      getSingaporeDayKey(completedAtValue) === todayKey
  ).length;

  const streaks = calculateStreakMetrics(completedAt);

  return {
    totalXp: gamificationResult.data?.total_xp ?? 0,
    gamesCompletedToday,
    dailyGoal: DAILY_SESSION_GOAL,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
  };
}
