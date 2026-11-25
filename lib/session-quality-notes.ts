import type {
  SessionQualityFlagCode,
} from "@/games/types";

export interface SessionQualityNote {
  title: string;
  description: string;
}

const qualityNotes: Record<
  SessionQualityFlagCode,
  SessionQualityNote
> = {
  high_timeout_rate: {
    title: "More timeouts than usual",
    description:
      "Many trials timed out. Interpret this session's accuracy with care.",
  },
  low_correct_response_count: {
    title: "Limited correct-response data",
    description:
      "There were few correct responses, so average reaction-time measures are based on limited data.",
  },
  very_short_response: {
    title: "Very fast response recorded",
    description:
      "One or more responses were extremely fast. This can reflect an accidental click or browser-timing limitation.",
  },
  long_session_duration: {
    title: "Longer session duration",
    description:
      "This session took longer than expected, which can happen if the browser was backgrounded or the session was interrupted.",
  },
};

export function getSessionQualityNote(
  code: SessionQualityFlagCode
) {
  return qualityNotes[code];
}