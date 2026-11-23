const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function isValidTimestamp(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export function getSingaporeDayKey(
  value: Date | string
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const values = new Map(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return [
    values.get("year"),
    values.get("month"),
    values.get("day"),
  ].join("-");
}

function getDayNumber(dayKey: string) {
  const [year, month, day] = dayKey
    .split("-")
    .map(Number);

  return Math.floor(
    Date.UTC(year, month - 1, day) /
      MILLISECONDS_PER_DAY
  );
}

export interface StreakMetrics {
  currentStreak: number;
  longestStreak: number;
}

export function calculateStreakMetrics(
  completedAt: string[],
  now = new Date()
): StreakMetrics {
  const completedDays = new Set(
    completedAt
      .filter(isValidTimestamp)
      .map((timestamp) =>
        getDayNumber(getSingaporeDayKey(timestamp))
      )
  );

  const sortedDays = [...completedDays].sort(
    (first, second) => first - second
  );

  if (sortedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  let longestStreak = 1;
  let consecutiveDays = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    if (
      sortedDays[index] ===
      sortedDays[index - 1] + 1
    ) {
      consecutiveDays += 1;
    } else {
      consecutiveDays = 1;
    }

    longestStreak = Math.max(
      longestStreak,
      consecutiveDays
    );
  }

  const today = getDayNumber(
    getSingaporeDayKey(now)
  );

  const mostRecentDay =
    sortedDays[sortedDays.length - 1];

  if (
    mostRecentDay < today - 1 ||
    mostRecentDay > today
  ) {
    return {
      currentStreak: 0,
      longestStreak,
    };
  }

  let currentStreak = 0;
  let expectedDay = mostRecentDay;

  while (completedDays.has(expectedDay)) {
    currentStreak += 1;
    expectedDay -= 1;
  }

  return {
    currentStreak,
    longestStreak,
  };
}