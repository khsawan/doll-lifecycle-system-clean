import { normalizeErrorResult } from "../../shared/contracts";
import { createAssetServiceFailureResponse } from "./responses";

export const ASSET_SERVICE_ERROR_CODES = Object.freeze({
  INVALID_REQUEST: "ASSET_INVALID_REQUEST",
  PUBLIC_LINK_UNAVAILABLE: "ASSET_PUBLIC_LINK_UNAVAILABLE",
  QR_GENERATION_FAILED: "ASSET_QR_GENERATION_FAILED",
  STORAGE_UNAVAILABLE: "ASSET_STORAGE_UNAVAILABLE",
  UPLOAD_FAILED: "ASSET_UPLOAD_FAILED",
  PERSISTENCE_FAILED: "ASSET_PERSISTENCE_FAILED",
  NOT_FOUND: "ASSET_NOT_FOUND",
  INTERNAL_ERROR: "ASSET_INTERNAL_ERROR",
});

const STABLE_ASSET_ERROR_CODE_SET = new Set(Object.values(ASSET_SERVICE_ERROR_CODES));

function readErrorText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isStableAssetServiceErrorCode(value) {
  return STABLE_ASSET_ERROR_CODE_SET.has(readErrorText(value));
}

export function mapAssetServiceErrorCode(
  error,
  fallbackCode = ASSET_SERVICE_ERROR_CODES.INTERNAL_ERROR
) {
  const normalized = normalizeErrorResult(error, {
    code: fallbackCode,
    message: "Asset request failed.",
  });
  const currentCode = readErrorText(normalized.code);
  const message = readErrorText(normalized.message).toLowerCase();
  const text = `${currentCode} ${message}`.toLowerCase();

  if (
    isStableAssetServiceErrorCode(currentCode) &&
    currentCode !== fallbackCode &&
    currentCode !== ASSET_SERVICE_ERROR_CODES.INTERNAL_ERROR
  ) {
    return currentCode;
  }

  if (/public link|public url|public path|slug/.test(text)) {
    return ASSET_SERVICE_ERROR_CODES.PUBLIC_LINK_UNAVAILABLE;
  }

  if (/generate a qr code first|qr source/.test(text)) {
    return ASSET_SERVICE_ERROR_CODES.QR_GENERATION_FAILED;
  }

  if (/supabase environment variables|storage|bucket/.test(text)) {
    return ASSET_SERVICE_ERROR_CODES.STORAGE_UNAVAILABLE;
  }

  if (
    currentCode === "INVALID_QR_GENERATION_COMMAND" ||
    currentCode === "INVALID_IMAGE_UPLOAD_REQUEST" ||
    /invalid|missing|required|unsupported/.test(text)
  ) {
    return ASSET_SERVICE_ERROR_CODES.INVALID_REQUEST;
  }

  if (
    currentCode === "QR_UPLOAD_FAILED" ||
    currentCode === "IMAGE_UPLOAD_FAILED" ||
    /upload/.test(text)
  ) {
    return ASSET_SERVICE_ERROR_CODES.UPLOAD_FAILED;
  }

  if (/persist|update|save|dolls/.test(text)) {
    return ASSET_SERVICE_ERROR_CODES.PERSISTENCE_FAILED;
  }

  if (/not found/.test(text)) {
    return ASSET_SERVICE_ERROR_CODES.NOT_FOUND;
  }

  if (isStableAssetServiceErrorCode(currentCode)) {
    return currentCode;
  }

  return fallbackCode;
}

export function isRetryableAssetServiceErrorCode(code) {
  return [
    ASSET_SERVICE_ERROR_CODES.STORAGE_UNAVAILABLE,
    ASSET_SERVICE_ERROR_CODES.UPLOAD_FAILED,
    ASSET_SERVICE_ERROR_CODES.PERSISTENCE_FAILED,
    ASSET_SERVICE_ERROR_CODES.INTERNAL_ERROR,
  ].includes(code);
}

export function normalizeAssetServiceError(
  error,
  {
    requestId,
    trace,
    fallbackCode = ASSET_SERVICE_ERROR_CODES.INTERNAL_ERROR,
    fallbackMessage = "Asset request failed.",
    retryable = false,
  } = {}
) {
  const normalized = normalizeErrorResult(error, {
    code: fallbackCode,
    message: fallbackMessage,
    retryable,
  });
  const stableCode = mapAssetServiceErrorCode(normalized, fallbackCode);

  return createAssetServiceFailureResponse({
    requestId,
    code: stableCode,
    message: normalized.message || fallbackMessage,
    retryable: normalized.retryable || isRetryableAssetServiceErrorCode(stableCode),
    details: normalized.details,
    trace,
  });
}
