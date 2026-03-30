import { ASSET_STORAGE_BUCKET } from "../domain/assetKinds";

function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFileName(value) {
  return readOptionalString(value);
}

function ensureAssetClient(client) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }
}

export async function uploadAssetBlob(
  client,
  { filePath, blob, contentType = "application/octet-stream", upsert = true } = {}
) {
  ensureAssetClient(client);

  const { error } = await client.storage.from(ASSET_STORAGE_BUCKET).upload(filePath, blob, {
    contentType,
    upsert,
  });

  if (error) {
    throw error;
  }

  return {
    filePath,
    publicUrl: readPublicAssetUrl(client, filePath),
  };
}

export async function uploadAssetFile(
  client,
  { filePath, file, upsert = true } = {}
) {
  ensureAssetClient(client);

  const { error } = await client.storage.from(ASSET_STORAGE_BUCKET).upload(filePath, file, {
    upsert,
  });

  if (error) {
    throw error;
  }

  return {
    filePath,
    publicUrl: readPublicAssetUrl(client, filePath),
  };
}

export function readPublicAssetUrl(client, filePath) {
  ensureAssetClient(client);
  const { data } = client.storage.from(ASSET_STORAGE_BUCKET).getPublicUrl(filePath);
  return readOptionalString(data?.publicUrl);
}

export function buildQrAssetPath(storageKey) {
  return `qr-codes/${readOptionalString(storageKey)}.png`;
}

export function buildDollImageAssetPath({ dollId, fileName, now = Date.now } = {}) {
  const normalizedFileName = normalizeFileName(fileName);
  return `dolls/${dollId}-${now()}-${normalizedFileName}`;
}
