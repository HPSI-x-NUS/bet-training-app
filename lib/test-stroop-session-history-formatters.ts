import assert from "node:assert/strict";

import {
  formatDurationMilliseconds,
  getStroopProtocolLabel,
  getTimedProtocolDurationLabel,
  isTimedStroopProtocol,
} from "./stroop-session-history-formatters";

assert.equal(
  getStroopProtocolLabel("1.0.0"),
  "40-trial Stroop"
);

assert.equal(
  getStroopProtocolLabel("2.0.0"),
  "3-minute timed Stroop"
);

assert.equal(
  getStroopProtocolLabel("9.0.0"),
  "Stroop protocol v9.0.0"
);

assert.equal(
  getStroopProtocolLabel(null),
  "Stroop protocol"
);

assert.equal(isTimedStroopProtocol("1.0.0"), false);
assert.equal(isTimedStroopProtocol("2.0.0"), true);

assert.equal(
  formatDurationMilliseconds(180000),
  "3m 0s"
);

assert.equal(
  formatDurationMilliseconds(61000),
  "1m 1s"
);

assert.equal(formatDurationMilliseconds(null), null);
assert.equal(formatDurationMilliseconds(0), null);

assert.equal(
  getTimedProtocolDurationLabel("2.0.0", {
    sessionMode: "fixed-duration",
    sessionDurationMs: 180000,
  }),
  "3m 0s"
);

assert.equal(
  getTimedProtocolDurationLabel("2.0.0", {}),
  null
);

assert.equal(
  getTimedProtocolDurationLabel("1.0.0", {
    sessionDurationMs: 180000,
  }),
  null
);

console.info(
  "Stroop session-history formatter tests passed."
);