function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAssetStorageKey(value) {
  return readOptionalString(value);
}

export function buildPublicAssetContext(metadata = {}) {
  return {
    publicUrl: readOptionalString(metadata?.publicUrl),
    publicPath: readOptionalString(metadata?.publicPath),
    selectedSlug: readOptionalString(metadata?.selectedSlug),
    storageKey: normalizeAssetStorageKey(metadata?.storageKey),
  };
}
