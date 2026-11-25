import { getNBackSessionHistory, getStroopSessionHistory } from "@/lib/cognitive-session-history";
export const cognitiveTaskAdapters = [{ gameId: "stroop", label: "Stroop", loadSessions: getStroopSessionHistory }, { gameId: "n-back", label: "N-Back", loadSessions: getNBackSessionHistory }] as const;
export async function getTasksWithSavedSessions() { const loaded = await Promise.all(cognitiveTaskAdapters.map(async (adapter) => ({ adapter, sessions: await adapter.loadSessions() }))); return loaded.filter(({ sessions }) => sessions.length > 0); }
