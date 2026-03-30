import { ASSET_OPERATIONS, resolveAssetOperation } from "./assetKinds";
import { buildPublicAssetContext, normalizeAssetStorageKey } from "./publicAssetContext";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeIdentifier(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function normalizeMetadata(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function normalizePayload(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function readAssetFile(value) {
  return value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    value.name.trim()
    ? value
    : null;
}

export function readAssetTargetId(request) {
  return normalizeIdentifier(request?.dollId) || normalizeIdentifier(request?.entityId);
}

export function createGenerateQrExecutionRequest(request = {}) {
  const operation = resolveAssetOperation(request?.operation);

  if (operation !== ASSET_OPERATIONS.GENERATE_QR) {
    throw new Error("Invalid QR generation request.");
  }

  const targetId = readAssetTargetId(request);
  const payload = normalizePayload(request?.payload);
  const storageKey = normalizeAssetStorageKey(payload.storageKey);
  const qrSource =
    typeof payload.qrSource === "string" && payload.qrSource.trim() ? payload.qrSource : "";

  if (!targetId) {
    throw new Error("A doll id is required.");
  }

  if (!storageKey || !qrSource) {
    throw new Error("Invalid QR upload payload.");
  }

  return {
    operation,
    dollId: targetId,
    storageKey,
    qrSource,
    forceRefresh: typeof payload.forceRefresh === "boolean" ? payload.forceRefresh : false,
    metadata: normalizeMetadata(request?.metadata),
    publicContext: buildPublicAssetContext(request?.metadata),
  };
}

export function createUploadImageExecutionRequest(request = {}) {
  const operation = resolveAssetOperation(request?.operation);

  if (operation !== ASSET_OPERATIONS.UPLOAD_IMAGE) {
    throw new Error("Invalid image upload request.");
  }

  const targetId = readAssetTargetId(request);
  const payload = normalizePayload(request?.payload);
  const file = readAssetFile(payload.file);

  if (!targetId) {
    throw new Error("A doll id is required.");
  }

  if (!file) {
    throw new Error("An image file is required.");
  }

  return {
    operation,
    dollId: targetId,
    file,
    metadata: normalizeMetadata(request?.metadata),
    publicContext: buildPublicAssetContext(request?.metadata),
  };
}
