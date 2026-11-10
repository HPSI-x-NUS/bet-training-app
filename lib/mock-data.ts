
export const mockAthlete = {
  name: "Athlete",
  level: 5,
  xp: 850,
  xpToNextLevel: 1000,
  streak: 7,
  dailyGoal: 3,
  gamesCompletedToday: 2,
};


export const mockGames = [
  {
    id: "stroop",
    name: "Stroop Test",
    description:
      "Challenge your attention by identifying ink colours while ignoring conflicting words.",
    category: "Interference Control",
    durationMinutes: 3,
    available: false,
  },
  {
    id: "n-back",
    name: "N-Back",
    description:
      "Train working memory by remembering and comparing sequences of stimuli.",
    category: "Working Memory",
    durationMinutes: 4,
    available: false,
  },
  {
    id: "flanker",
    name: "Flanker Task",
    description:
      "Focus on a central target while ignoring surrounding distractions.",
    category: "Selective Attention",
    durationMinutes: 3,
    available: false,
  },
  {
    id: "go-no-go",
    name: "Go/No-Go",
    description:
      "Practise response inhibition by reacting to Go signals and withholding responses to No-Go signals.",
    category: "Response Inhibition",
    durationMinutes: 4,
    available: false,
  },
];
