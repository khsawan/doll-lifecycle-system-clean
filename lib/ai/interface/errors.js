import { normalizeErrorResult } from "../../shared/contracts/index.js";
import { createAIServiceFailureResponse } from "./responses.js";

export const AI_SERVICE_ERROR_CODES = Object.freeze({
  INVALID_REQUEST: "AI_INVALID_REQUEST",
  SETTINGS_UNAVAILABLE: "AI_SETTINGS_UNAVAILABLE",
  PROMPT_BUILD_FAILED: "AI_PROMPT_BUILD_FAILED",
  PROVIDER_UNAVAILABLE: "AI_PROVIDER_UNAVAILABLE",
  PROVIDER_TIMEOUT: "AI_PROVIDER_TIMEOUT",
  PROVIDER_REJECTED: "AI_PROVIDER_REJECTED",
  NORMALIZATION_FAILED: "AI_NORMALIZATION_FAILED",
  INTERNAL_ERROR: "AI_INTERNAL_ERROR",
});

const STABLE_AI_ERROR_CODE_SET = new Set(Object.values(AI_SERVICE_ERROR_CODES));

function readErrorText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isStableAIServiceErrorCode(value) {
  return STABLE_AI_ERROR_CODE_SET.has(readErrorText(value));
}

export function mapAIServiceErrorCode(error, fallbackCode = AI_SERVICE_ERROR_CODES.INTERNAL_ERROR) {
  const normalized = normalizeErrorResult(error, {
    code: fallbackCode,
    message: "AI request failed.",
  });
  const currentCode = readErrorText(normalized.code);
  const message = readErrorText(normalized.message).toLowerCase();
  const text = `${currentCode} ${message}`.toLowerCase();

  if (
    isStableAIServiceErrorCode(currentCode) &&
    currentCode !== fallbackCode &&
    currentCode !== AI_SERVICE_ERROR_CODES.INTERNAL_ERROR
  ) {
    return currentCode;
  }

  if (/invalid|missing|unsupported/.test(text)) {
    return AI_SERVICE_ERROR_CODES.INVALID_REQUEST;
  }

  if (/settings/.test(text)) {
    return AI_SERVICE_ERROR_CODES.SETTINGS_UNAVAILABLE;
  }

  if (/prompt/.test(text)) {
    return AI_SERVICE_ERROR_CODES.PROMPT_BUILD_FAILED;
  }

  if (/timeout|timed out|abort/.test(text)) {
    return AI_SERVICE_ERROR_CODES.PROVIDER_TIMEOUT;
  }

  if (/status 4\d\d|rejected|forbidden|unauthorized|rate limit|429/.test(text)) {
    return AI_SERVICE_ERROR_CODES.PROVIDER_REJECTED;
  }

  if (/valid json|normaliz|variation|empty response/.test(text)) {
    return AI_SERVICE_ERROR_CODES.NORMALIZATION_FAILED;
  }

  if (/provider|anthropic request failed/.test(text)) {
    return AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE;
  }

  if (isStableAIServiceErrorCode(currentCode)) {
    return currentCode;
  }

  return fallbackCode;
}

export function isRetryableAIServiceErrorCode(code) {
  return [
    AI_SERVICE_ERROR_CODES.SETTINGS_UNAVAILABLE,
    AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE,
    AI_SERVICE_ERROR_CODES.PROVIDER_TIMEOUT,
    AI_SERVICE_ERROR_CODES.INTERNAL_ERROR,
  ].includes(code);
}

export function normalizeAIServiceError(
  error,
  {
    requestId,
    trace,
    fallbackCode = AI_SERVICE_ERROR_CODES.INTERNAL_ERROR,
    fallbackMessage = "AI request failed.",
    retryable = false,
  } = {}
) {
  const normalized = normalizeErrorResult(error, {
    code: fallbackCode,
    message: fallbackMessage,
    retryable,
  });
  const stableCode = mapAIServiceErrorCode(normalized, fallbackCode);

  return createAIServiceFailureResponse({
    requestId,
    code: stableCode,
    message: normalized.message || fallbackMessage,
    retryable: normalized.retryable || isRetryableAIServiceErrorCode(stableCode),
    details: normalized.details,
    trace,
  });
}
