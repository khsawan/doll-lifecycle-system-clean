export const ASSET_OPERATIONS = Object.freeze({
  GENERATE_QR: "generate_qr",
  UPLOAD_IMAGE: "upload_image",
});

export const ASSET_KINDS = Object.freeze({
  QR: "qr",
  IMAGE: "image",
});

export const ASSET_STORAGE_BUCKET = "doll-assets";

const ASSET_OPERATION_SET = new Set(Object.values(ASSET_OPERATIONS));

function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAssetOperation(value) {
  const normalized = readOptionalString(value).toLowerCase();
  return ASSET_OPERATION_SET.has(normalized) ? normalized : "";
}

export function resolveAssetOperation(value) {
  const normalized = normalizeAssetOperation(value);

  if (!normalized) {
    throw new Error("Invalid asset operation.");
  }

  return normalized;
}
