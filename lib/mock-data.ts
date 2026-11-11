import { getAllGames } from "@/games/registry";

export const mockAthlete = {
  name: "Athlete",
  level: 5,
  xp: 850,
  xpToNextLevel: 1000,
  streak: 7,
  dailyGoal: 3,
  gamesCompletedToday: 2,
};


export const mockGames = getAllGames();
    