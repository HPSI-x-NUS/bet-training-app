import assert from "node:assert/strict";

import {
  getCognitiveSessionHistoryContext,
  toStroopSessionHistoryItem,
  type CognitiveSessionHistoryRow,
} from "./cognitive-session-history";

const validStroopRow: CognitiveSessionHistoryRow = {
  id: "session-1",
  game_id: "stroop",
  completed_at: "2026-11-25T06:00:00.000Z",
  config_version: "2.0.0",
  config: {
    sessionMode: "fixed-duration",
    sessionDurationMs: 180000,
  },
  metrics: {
    totalTrials: 55,
    correctTrials: 43,
    accuracy: 78.2,
    meanReactionTimeMs: 612.4,
    additionalMetrics: {
      timeoutTrials: 3,
      stroopInterferenceMs: 87.1,
    },
  },
  game_points: 430,
  quality_flags: [{ code: "high_timeout_rate" }],
};

const context = getCognitiveSessionHistoryContext(validStroopRow);

assert.deepEqual(context, {
  id: "session-1",
  gameId: "stroop",
  completedAt: "2026-11-25T06:00:00.000Z",
  configVersion: "2.0.0",
  config: validStroopRow.config,
  gamePoints: 430,
  qualityFlags: [{ code: "high_timeout_rate" }],
});

const stroopSession = toStroopSessionHistoryItem(validStroopRow);

assert.equal(stroopSession?.gameId, "stroop");
assert.equal(stroopSession?.accuracy, 78.2);
assert.equal(stroopSession?.timeoutTrials, 3);
assert.equal(stroopSession?.stroopInterferenceMs, 87.1);

assert.equal(
  toStroopSessionHistoryItem({
    ...validStroopRow,
    game_id: "n-back",
  }),
  null
);

assert.equal(
  getCognitiveSessionHistoryContext({
    ...validStroopRow,
    completed_at: null,
  }),
  null
);

const missingMetrics = toStroopSessionHistoryItem({
  ...validStroopRow,
  config_version: null,
  metrics: "invalid",
  game_points: "invalid",
  quality_flags: [{ code: "not-a-known-flag" }],
});

assert.equal(missingMetrics?.configVersion, null);
assert.equal(missingMetrics?.gamePoints, 0);
assert.equal(missingMetrics?.accuracy, null);
assert.deepEqual(missingMetrics?.qualityFlags, []);

console.info("Cognitive session-history adapter tests passed.");
