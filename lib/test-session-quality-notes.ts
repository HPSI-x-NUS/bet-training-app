import assert from "node:assert/strict";

import { getSessionQualityNote } from "./session-quality-notes";

assert.deepEqual(
  getSessionQualityNote("high_timeout_rate"),
  {
    title: "More timeouts than usual",
    description:
      "Many trials timed out. Interpret this session's accuracy with care.",
  }
);

assert.deepEqual(
  getSessionQualityNote("low_correct_response_count"),
  {
    title: "Limited correct-response data",
    description:
      "There were few correct responses, so average reaction-time measures are based on limited data.",
  }
);

assert.deepEqual(
  getSessionQualityNote("very_short_response"),
  {
    title: "Very fast response recorded",
    description:
      "One or more responses were extremely fast. This can reflect an accidental click or browser-timing limitation.",
  }
);

assert.deepEqual(
  getSessionQualityNote("long_session_duration"),
  {
    title: "Longer session duration",
    description:
      "This session took longer than expected, which can happen if the browser was backgrounded or the session was interrupted.",
  }
);

console.info("Session quality-note tests passed.");