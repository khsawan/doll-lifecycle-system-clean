function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCode(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeMessage(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeWarnings(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

export function createSuccessResult({
  code = "SUCCESS",
  message = "Success.",
  data = null,
  warnings = [],
} = {}) {
  return {
    ok: true,
    code: normalizeCode(code, "SUCCESS"),
    message: normalizeMessage(message, "Success."),
    data,
    warnings: normalizeWarnings(warnings),
  };
}

export function createFailureResult({
  code = "UNKNOWN_ERROR",
  message = "Request failed.",
  retryable = false,
  details,
} = {}) {
  const result = {
    ok: false,
    code: normalizeCode(code, "UNKNOWN_ERROR"),
    message: normalizeMessage(message, "Request failed."),
    retryable: Boolean(retryable),
  };

  if (details !== undefined) {
    result.details = details;
  }

  return result;
}

export function isSuccessResult(value) {
  return isPlainObject(value) && value.ok === true && typeof value.code === "string";
}

export function isFailureResult(value) {
  return isPlainObject(value) && value.ok === false && typeof value.code === "string";
}

export function readSuccessResultData(value, fallback = null) {
  return isSuccessResult(value) ? value.data ?? fallback : fallback;
}
