import { createFailureResult, createSuccessResult } from "../../shared/contracts";
import { createAssetRequestId, normalizeAssetRequestId } from "./trace";
import { sanitizeTransportObject, sanitizeTransportValue } from "./transport";

function hasKeys(value) {
  return Boolean(value) && typeof value === "object" && Object.keys(value).length > 0;
}

export function createAssetServiceSuccessResponse({
  requestId,
  code = "ASSET_OPERATION_COMPLETED",
  message = "Asset operation completed.",
  data = null,
  warnings = [],
  trace,
} = {}) {
  const response = createSuccessResult({
    code,
    message,
    data: sanitizeTransportValue(data),
    warnings,
  });
  const normalizedTrace = sanitizeTransportObject(trace, {});

  response.requestId = normalizeAssetRequestId(requestId) || createAssetRequestId();

  if (hasKeys(normalizedTrace)) {
    response.trace = normalizedTrace;
  }

  return response;
}

export function createAssetServiceFailureResponse({
  requestId,
  code = "ASSET_INTERNAL_ERROR",
  message = "Asset request failed.",
  retryable = false,
  details,
  trace,
} = {}) {
  const response = createFailureResult({
    code,
    message,
    retryable,
    details: sanitizeTransportValue(details),
  });
  const normalizedTrace = sanitizeTransportObject(trace, {});

  response.requestId = normalizeAssetRequestId(requestId) || createAssetRequestId();

  if (hasKeys(normalizedTrace)) {
    response.trace = normalizedTrace;
  }

  return response;
}
