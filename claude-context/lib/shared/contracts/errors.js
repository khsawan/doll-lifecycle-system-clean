import { createFailureResult, isFailureResult } from "./results.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readMessage(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function readRetryable(value, fallback) {
  return typeof value === "boolean" ? value : Boolean(fallback);
}

export function normalizeErrorResult(
  error,
  {
    code = "UNKNOWN_ERROR",
    message = "Request failed.",
    retryable = false,
    details,
  } = {}
) {
  if (isFailureResult(error)) {
    return createFailureResult({
      code: error.code || code,
      message: error.message || message,
      retryable: readRetryable(error.retryable, retryable),
      details: error.details !== undefined ? error.details : details,
    });
  }

  if (error instanceof Error) {
    return createFailureResult({
      code,
      message: error.message || message,
      retryable,
      details,
    });
  }

  if (isPlainObject(error)) {
    const normalizedMessage =
      readMessage(error.message) || readMessage(error.error) || readMessage(message);

    return createFailureResult({
      code: readMessage(error.code) || code,
      message: normalizedMessage || "Request failed.",
      retryable: readRetryable(error.retryable, retryable),
      details: error.details !== undefined ? error.details : details,
    });
  }

  if (typeof error === "string") {
    return createFailureResult({
      code,
      message: error,
      retryable,
      details,
    });
  }

  return createFailureResult({
    code,
    message,
    retryable,
    details,
  });
}

export function readFailureResultMessage(error, fallbackMessage = "Request failed.") {
  return normalizeErrorResult(error, {
    message: fallbackMessage,
  }).message;
}
