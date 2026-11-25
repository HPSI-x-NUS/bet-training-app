import type { GameId, SessionQualityFlag } from "@/games/types";
export interface CognitiveHistorySession { id: string; gameId: GameId; completedAt: string; configVersion: string | null; config: unknown; gamePoints: number; qualityFlags: SessionQualityFlag[]; }
export interface CognitiveTaskAdapter<TSession extends CognitiveHistorySession> { gameId: TSession["gameId"]; label: string; loadSessions: () => Promise<TSession[]>; }
