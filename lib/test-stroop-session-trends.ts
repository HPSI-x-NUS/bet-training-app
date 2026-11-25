import assert from "node:assert/strict";

import type {
    StroopSessionHistoryItem,
} from "./cognitive-session-history";
import {
    filterStroopSessions,
    getStroopTrendPoints,
    getStroopTrendSummary,
    getStroopTrendTimelineLabels,
} from "./stroop-session-trends";

function makeSession(
    overrides: Partial<StroopSessionHistoryItem>
): StroopSessionHistoryItem {
    return {
        id: "session",
        gameId: "stroop",
        completedAt: "2026-11-20T10:00:00+08:00",
        configVersion: "2.0.0",
        config: {},
        totalTrials: 100,
        correctTrials: 90,
        accuracy: 90,
        meanReactionTimeMs: 800,
        timeoutTrials: 2,
        stroopInterferenceMs: 50,
        gamePoints: 900,
        qualityFlags: [],
        ...overrides,
    };
}

const v1Session = makeSession({
    id: "v1",
    configVersion: "1.0.0",
});

const timedEarly = makeSession({
    id: "timed-early",
    completedAt: "2026-11-18T10:00:00+08:00",
    accuracy: 88.2,
    meanReactionTimeMs: 824,
    stroopInterferenceMs: 76,
});

const timedFlagged = makeSession({
    id: "timed-flagged",
    completedAt: "2026-11-20T10:00:00+08:00",
    accuracy: 91.4,
    meanReactionTimeMs: 792,
    stroopInterferenceMs: 54,
    qualityFlags: [{ code: "high_timeout_rate" }],
});

const timedLatest = makeSession({
    id: "timed-latest",
    completedAt: "2026-11-25T10:00:00+08:00",
    accuracy: 95.6,
    meanReactionTimeMs: 769,
    stroopInterferenceMs: -22,
});

const sessions = [
    timedLatest,
    v1Session,
    timedFlagged,
    timedEarly,
];

assert.deepEqual(
    filterStroopSessions(sessions, "1.0.0").map(
        (session) => session.id
    ),
    ["v1"]
);

assert.deepEqual(
    filterStroopSessions(sessions, "2.0.0").map(
        (session) => session.id
    ),
    ["timed-latest", "timed-flagged", "timed-early"]
);

const accuracyPoints = getStroopTrendPoints(
    sessions,
    "2.0.0",
    "accuracy"
);

assert.deepEqual(
    accuracyPoints.map((point) => point.id),
    ["timed-early", "timed-flagged", "timed-latest"]
);

assert.equal(
    accuracyPoints[1].hasQualityFlags,
    true
);

assert.deepEqual(
    getStroopTrendSummary("accuracy", accuracyPoints),
    {
        change: 7.3999999999999915,
        displayValue: "+7.4%",
        tone: "good",
    }
);

const reactionTimePoints = getStroopTrendPoints(
    sessions,
    "2.0.0",
    "meanReactionTimeMs"
);

assert.deepEqual(
    getStroopTrendSummary(
        "meanReactionTimeMs",
        reactionTimePoints
    ),
    {
        change: -55,
        displayValue: "-55 ms",
        tone: "good",
    }
);

const interferencePoints = getStroopTrendPoints(
    sessions,
    "2.0.0",
    "stroopInterferenceMs"
);

assert.deepEqual(
    getStroopTrendSummary(
        "stroopInterferenceMs",
        interferencePoints
    ),
    {
        change: -98,
        displayValue: "-98 ms",
        tone: "good",
    }
);

assert.deepEqual(
    getStroopTrendSummary("accuracy", [
        accuracyPoints[0],
    ]),
    null
);

assert.deepEqual(
    getStroopTrendPoints(
        [
            makeSession({
                id: "missing-accuracy",
                completedAt: "2026-11-19T10:00:00+08:00",
                accuracy: null,
            }),
            timedEarly,
        ],
        "2.0.0",
        "accuracy"
    ).map((point) => point.id),
    ["timed-early"]
);

const timelineLabels = getStroopTrendTimelineLabels([
  {
    id: "first-same-day",
    completedAt: "2026-11-25T00:08:00+08:00",
    value: 90,
    hasQualityFlags: false,
  },
  {
    id: "second-same-day",
    completedAt: "2026-11-25T00:32:00+08:00",
    value: 92,
    hasQualityFlags: false,
  },
  {
    id: "different-day",
    completedAt: "2026-11-26T00:08:00+08:00",
    value: 93,
    hasQualityFlags: false,
  },
]);

assert.deepEqual(timelineLabels, [
  {
    id: "first-same-day",
    graphLabel: "25 Nov, 12:08 am",
    tableLabel: "25 Nov 2026, 12:08 am",
  },
  {
    id: "second-same-day",
    graphLabel: "25 Nov, 12:32 am",
    tableLabel: "25 Nov 2026, 12:32 am",
  },
  {
    id: "different-day",
    graphLabel: "26 Nov",
    tableLabel: "26 Nov 2026, 12:08 am",
  },
]);

console.info("Stroop session-trend tests passed.");
