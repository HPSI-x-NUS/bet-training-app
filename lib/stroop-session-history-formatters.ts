type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

export function getStroopProtocolLabel(
  configVersion: string | null
) {
  switch (configVersion) {
    case "1.0.0":
      return "40-trial Stroop";
    case "2.0.0":
      return "3-minute timed Stroop";
    case null:
      return "Stroop protocol";
    default:
      return `Stroop protocol v${configVersion}`;
  }
}

export function isTimedStroopProtocol(
  configVersion: string | null
) {
  return configVersion === "2.0.0";
}

export function formatDurationMilliseconds(
  durationMs: number | null
) {
  if (
    durationMs === null ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return null;
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s`;
}

export function getTimedProtocolDurationLabel(
  configVersion: string | null,
  config: unknown
) {
  if (!isTimedStroopProtocol(configVersion)) {
    return null;
  }

  if (!isJsonRecord(config)) {
    return null;
  }

  const durationMs = config.sessionDurationMs;

  return typeof durationMs === "number"
    ? formatDurationMilliseconds(durationMs)
    : null;
}