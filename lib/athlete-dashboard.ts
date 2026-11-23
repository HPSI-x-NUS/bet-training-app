import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const DAILY_SESSION_GOAL = 3;

function getSingaporeDayBounds() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  // Singapore is UTC+8 and does not observe daylight saving time.
  const startOfToday = new Date(
    Date.UTC(year, month - 1, day, -8)
  );

  const startOfTomorrow = new Date(
    startOfToday.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    startOfToday: startOfToday.toISOString(),
    startOfTomorrow: startOfTomorrow.toISOString(),
  };
}

export async function getAthleteDashboardData() {
  const user = await requireRole("athlete");
  const supabase = await createClient();

  const {
    startOfToday,
    startOfTomorrow,
  } = getSingaporeDayBounds();

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
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("athlete_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", startOfToday)
      .lt("completed_at", startOfTomorrow),
  ]);

  if (gamificationResult.error) {
    throw new Error(
      `Unable to load your XP: ${gamificationResult.error.message}`
    );
  }

  if (completedSessionsResult.error) {
    throw new Error(
      "Unable to load today's completed sessions: " +
        completedSessionsResult.error.message
    );
  }

  return {
    totalXp: gamificationResult.data?.total_xp ?? 0,
    gamesCompletedToday:
      completedSessionsResult.count ?? 0,
    dailyGoal: DAILY_SESSION_GOAL,
  };
}