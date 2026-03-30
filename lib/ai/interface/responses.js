import {
  createFailureResult,
  createSuccessResult,
} from "../../shared/contracts/index.js";
import { createAIRequestId, normalizeAIRequestId } from "./trace.js";
import { sanitizeTransportObject, sanitizeTransportValue } from "./transport.js";

function hasKeys(value) {
  return Boolean(value) && typeof value === "object" && Object.keys(value).length > 0;
}

export function createAIServiceSuccessResponse({
  requestId,
  code = "AI_GENERATION_COMPLETED",
  message = "AI content generated.",
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

  response.requestId = normalizeAIRequestId(requestId) || createAIRequestId();

  if (hasKeys(normalizedTrace)) {
    response.trace = normalizedTrace;
  }

  return response;
}

export function createAIServiceFailureResponse({
  requestId,
  code = "AI_INTERNAL_ERROR",
  message = "AI request failed.",
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

  response.requestId = normalizeAIRequestId(requestId) || createAIRequestId();

  if (hasKeys(normalizedTrace)) {
    response.trace = normalizedTrace;
  }

  return response;
}
