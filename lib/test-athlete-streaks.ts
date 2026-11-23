import {
  calculateStreakMetrics,
} from "./athlete-streaks";

function assertEqual(
  actual: number,
  expected: number,
  message: string
) {
  if (actual !== expected) {
    throw new Error(
      `${message}. Expected ${expected}, received ${actual}.`
    );
  }
}

const today = new Date(
  "2026-11-24T12:00:00+08:00"
);

function completedOn(day: string) {
  return `${day}T10:00:00+08:00`;
}

const noSessions = calculateStreakMetrics(
  [],
  today
);

assertEqual(
  noSessions.currentStreak,
  0,
  "No sessions should have no current streak"
);

assertEqual(
  noSessions.longestStreak,
  0,
  "No sessions should have no longest streak"
);

const consecutiveSessions = calculateStreakMetrics(
  [
    completedOn("2026-11-22"),
    completedOn("2026-11-23"),
    completedOn("2026-11-24"),
    completedOn("2026-11-24"),
  ],
  today
);

assertEqual(
  consecutiveSessions.currentStreak,
  3,
  "Consecutive Singapore dates should form a three-day streak"
);

assertEqual(
  consecutiveSessions.longestStreak,
  3,
  "Duplicate sessions on one day must not extend a streak"
);

const yesterdayOnly = calculateStreakMetrics(
  [completedOn("2026-11-23")],
  today
);

assertEqual(
  yesterdayOnly.currentStreak,
  1,
  "A session yesterday should keep a one-day streak active"
);

const brokenStreak = calculateStreakMetrics(
  [
    completedOn("2026-11-20"),
    completedOn("2026-11-21"),
    completedOn("2026-11-22"),
  ],
  today
);

assertEqual(
  brokenStreak.currentStreak,
  0,
  "A session before yesterday should not keep a streak active"
);

assertEqual(
  brokenStreak.longestStreak,
  3,
  "Longest streak should remain available after a current streak breaks"
);

console.info("Athlete streak calculations passed successfully.");