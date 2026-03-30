import { sanitizeTransportObject } from "./transport";

let fallbackRequestCounter = 0;

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAssetRequestId(value) {
  return readOptionalString(value);
}

export function createAssetRequestId(prefix = "asset") {
  const normalizedPrefix = readOptionalString(prefix) || "asset";

  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${normalizedPrefix}_${globalThis.crypto.randomUUID()}`;
  }

  fallbackRequestCounter += 1;
  return `${normalizedPrefix}_${Date.now()}_${fallbackRequestCounter}`;
}

export function createAssetTraceMetadata({
  requestId,
  operation,
  assetKind,
  dollId,
  entityId,
  metadata,
  executionMode = "in_process",
} = {}) {
  const trace = {
    requestId: normalizeAssetRequestId(requestId) || createAssetRequestId(),
    executionMode: readOptionalString(executionMode) || "in_process",
  };
  const normalizedOperation = readOptionalString(operation);
  const normalizedAssetKind = readOptionalString(assetKind);
  const normalizedDollId = readOptionalString(dollId);
  const normalizedEntityId = readOptionalString(entityId);
  const normalizedCorrelationId =
    readOptionalString(metadata?.correlationId) || readOptionalString(metadata?.correlation_id);
  const normalizedRequestSource =
    readOptionalString(metadata?.requestSource) || readOptionalString(metadata?.request_source);
  const normalizedSelectedSlug = readOptionalString(metadata?.selectedSlug);
  const normalizedPublicPath = readOptionalString(metadata?.publicPath);
  const normalizedPublicUrl = readOptionalString(metadata?.publicUrl);
  const normalizedStorageKey = readOptionalString(metadata?.storageKey);

  if (normalizedOperation) {
    trace.operation = normalizedOperation;
  }

  if (normalizedAssetKind) {
    trace.assetKind = normalizedAssetKind;
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

  if (normalizedSelectedSlug) {
    trace.selectedSlug = normalizedSelectedSlug;
  }

  if (normalizedPublicPath) {
    trace.publicPath = normalizedPublicPath;
  }

  if (normalizedPublicUrl) {
    trace.publicUrl = normalizedPublicUrl;
  }

  if (normalizedStorageKey) {
    trace.storageKey = normalizedStorageKey;
  }

  return sanitizeTransportObject(trace, {});
}
