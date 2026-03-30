import { sanitizeTransportObject } from "./transport.js";

let fallbackRequestCounter = 0;

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAIRequestId(value) {
  return readOptionalString(value);
}

export function createAIRequestId(prefix = "ai") {
  const normalizedPrefix = readOptionalString(prefix) || "ai";

  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${normalizedPrefix}_${globalThis.crypto.randomUUID()}`;
  }

  fallbackRequestCounter += 1;
  return `${normalizedPrefix}_${Date.now()}_${fallbackRequestCounter}`;
}

export function createAITraceMetadata({
  requestId,
  task,
  provider,
  dollId,
  entityId,
  metadata,
  executionMode = "in_process",
} = {}) {
  const trace = {
    requestId: normalizeAIRequestId(requestId) || createAIRequestId(),
    executionMode: readOptionalString(executionMode) || "in_process",
  };
  const normalizedTask = readOptionalString(task);
  const normalizedProvider = readOptionalString(provider);
  const normalizedDollId = readOptionalString(dollId);
  const normalizedEntityId = readOptionalString(entityId);
  const normalizedCorrelationId =
    readOptionalString(metadata?.correlationId) || readOptionalString(metadata?.correlation_id);
  const normalizedRequestSource =
    readOptionalString(metadata?.requestSource) || readOptionalString(metadata?.request_source);

  if (normalizedTask) {
    trace.task = normalizedTask;
  }

  if (normalizedProvider) {
    trace.provider = normalizedProvider;
  }

  if (normalizedDollId) {
    trace.dollId = normalizedDollId;
  }

  if (normalizedEntityId) {
    trace.entityId = normalizedEntityId;
  }

  if (normalizedCorrelationId) {
    trace.correlationId = normalizedCorrelationId;
  }

  if (normalizedRequestSource) {
    trace.requestSource = normalizedRequestSource;
  }

  return sanitizeTransportObject(trace, {});
}
