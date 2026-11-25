import type { GameId } from "./types";

/**
 * Descriptive information about a cognitive game.
 *
 * This is UI metadata, not the scientific task configuration.
 */
export interface GameDefinition {
  id: GameId;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  available: boolean;
}

/**
 * Central registry of cognitive games.
 *
 * Add future games here after extending GameId.
 */
export const gameRegistry = {
  stroop: {
    id: "stroop",
    name: "Stroop Test",
    description:
      "Challenge your attention by identifying ink colours while ignoring conflicting words.",
    category: "Interference Control",
    durationMinutes: 3,
    available: true,
  },
  "n-back": {
    id: "n-back",
    name: "N-Back",
    description:
      "Train working memory by remembering and comparing sequences of stimuli.",
    category: "Working Memory",
    durationMinutes: 3,
    available: true,
  },
  flanker: {
    id: "flanker",
    name: "Flanker Task",
    description:
      "Focus on a central target while ignoring surrounding distractions.",
    category: "Selective Attention",
    durationMinutes: 3,
    available: false,
  },
  "go-no-go": {
    id: "go-no-go",
    name: "Go/No-Go",
    description:
      "Practise response inhibition by reacting to Go signals and withholding responses to No-Go signals.",
    category: "Response Inhibition",
    durationMinutes: 4,
    available: false,
  },
} satisfies Record<GameId, GameDefinition>;

/**
 * Retrieve a single game by ID.
 */
export function getGame(id: GameId): GameDefinition {
  return gameRegistry[id];
}

/**
 * Retrieve all registered games.
 */
export function getAllGames(): GameDefinition[] {
  return Object.values(gameRegistry);
}

/**
 * Retrieve only playable games.
 */
export function getAvailableGames(): GameDefinition[] {
  return getAllGames().filter((game) => game.available);
}
