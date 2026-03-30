export const AI_SERVICE_MODES = Object.freeze({
  LOCAL: "local",
  REMOTE: "remote",
});

const AI_SERVICE_MODE_SET = new Set(Object.values(AI_SERVICE_MODES));
const DEFAULT_AI_SERVICE_TIMEOUT_MS = 8000;

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function normalizeServiceMode(value) {
  const normalized = readOptionalString(value).toLowerCase();
  return AI_SERVICE_MODE_SET.has(normalized) ? normalized : "";
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = readOptionalString(value).toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return false;
}

function normalizeTimeoutMs(value, fallback = DEFAULT_AI_SERVICE_TIMEOUT_MS) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  const parsedValue = Number.parseInt(readOptionalString(value), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export function readAIServiceRuntimeConfig(input = {}) {
  const resolvedInput = input && typeof input === "object" ? input : {};
  const env =
    resolvedInput.env && typeof resolvedInput.env === "object" ? resolvedInput.env : process.env;
  const mode =
    normalizeServiceMode(resolvedInput.aiServiceMode || resolvedInput.mode || env.AI_SERVICE_MODE) ||
    AI_SERVICE_MODES.LOCAL;
  const baseUrl = readOptionalString(
    resolvedInput.aiServiceBaseUrl || resolvedInput.baseUrl || env.AI_SERVICE_BASE_URL
  );
  const timeoutMs = normalizeTimeoutMs(
    resolvedInput.aiServiceTimeoutMs || resolvedInput.timeoutMs || env.AI_SERVICE_TIMEOUT_MS
  );
  const allowLocalFallback = normalizeBoolean(
    resolvedInput.aiServiceAllowLocalFallback ||
      resolvedInput.allowLocalFallback ||
      env.AI_SERVICE_ALLOW_LOCAL_FALLBACK
  );

  return {
    mode,
    baseUrl,
    timeoutMs,
    allowLocalFallback,
  };
}
