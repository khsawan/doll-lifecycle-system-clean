function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeGenerateQrResult(result = {}) {
  return {
    filePath: readOptionalString(result?.filePath),
    publicQrUrl: readOptionalString(result?.publicQrUrl),
    storedQrUrl: readOptionalString(result?.storedQrUrl),
  };
}

export function normalizeUploadImageResult(result = {}) {
  return {
    filePath: readOptionalString(result?.filePath),
    publicImageUrl: readOptionalString(result?.publicImageUrl),
  };
}
