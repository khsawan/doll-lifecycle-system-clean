import { isInternalCommandEnvelope } from "../../shared/contracts";
import { ASSET_OPERATIONS, normalizeAssetOperation } from "../domain/assetKinds";
import { normalizeAssetStorageKey } from "../domain/publicAssetContext";
import { createAssetRequestId, normalizeAssetRequestId } from "./trace";
import { sanitizeTransportObject } from "./transport";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function normalizeIdentifier(value) {
  return readOptionalString(value);
}

function normalizeGenerateQrPayload(value) {
  const payload = isPlainObject(value) ? { ...value } : {};

  return {
    storageKey: normalizeAssetStorageKey(payload.storageKey),
    qrSource: readOptionalString(payload.qrSource),
    forceRefresh: typeof payload.forceRefresh === "boolean" ? payload.forceRefresh : false,
  };
}

function normalizeUploadImagePayload(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function normalizeAssetPayload(operation, value) {
  switch (operation) {
    case ASSET_OPERATIONS.GENERATE_QR:
      return normalizeGenerateQrPayload(value);
    case ASSET_OPERATIONS.UPLOAD_IMAGE:
      return normalizeUploadImagePayload(value);
    default:
      return isPlainObject(value) ? { ...value } : {};
  }
}

export function isAssetServiceRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  if (!normalizeAssetRequestId(value.requestId)) {
    return false;
  }

  if (!normalizeAssetOperation(value.operation)) {
    return false;
  }

  if (!value.payload || typeof value.payload !== "object" || Array.isArray(value.payload)) {
    return false;
  }

  if (value.metadata !== undefined && (!value.metadata || typeof value.metadata !== "object")) {
    return false;
  }

  if (value.dollId !== undefined && !normalizeIdentifier(value.dollId)) {
    return false;
  }

  if (value.entityId !== undefined && !normalizeIdentifier(value.entityId)) {
    return false;
  }

  return true;
}

export function createAssetServiceRequest({
  requestId,
  operation,
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  const normalizedOperation = normalizeAssetOperation(operation);

  if (!normalizedOperation) {
    throw new Error("Invalid asset service operation.");
  }

  const request = {
    requestId: normalizeAssetRequestId(requestId) || createAssetRequestId(),
    operation: normalizedOperation,
    payload: normalizeAssetPayload(normalizedOperation, payload),
    metadata: sanitizeTransportObject(metadata, {}),
  };
  const normalizedDollId = normalizeIdentifier(dollId);
  const normalizedEntityId = normalizeIdentifier(entityId);

  if (normalizedDollId) {
    request.dollId = normalizedDollId;
  }

  if (normalizedEntityId) {
    request.entityId = normalizedEntityId;
  }

  return request;
}

export function createGenerateQrRequest({
  requestId,
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  return createAssetServiceRequest({
    requestId,
    operation: ASSET_OPERATIONS.GENERATE_QR,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createUploadImageRequest({
  requestId,
  dollId,
  entityId,
  payload,
  file,
  metadata,
} = {}) {
  return createAssetServiceRequest({
    requestId,
    operation: ASSET_OPERATIONS.UPLOAD_IMAGE,
    dollId,
    entityId,
    payload:
      file !== undefined
        ? {
            ...(isPlainObject(payload) ? payload : {}),
            file,
          }
        : payload,
    metadata,
  });
}

export function createAssetServiceRequestFromCommand(command, operation) {
  if (!isInternalCommandEnvelope(command)) {
    throw new Error("Invalid asset command.");
  }

  return createAssetServiceRequest({
    requestId: command?.metadata?.requestId,
    operation,
    dollId: command?.dollId,
    entityId: command?.entityId,
    payload: command?.payload,
    metadata: command?.metadata,
  });
}
