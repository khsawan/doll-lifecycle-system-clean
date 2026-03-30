import { updateDollQrCodeUrl } from "./dolls";
import { buildQrAssetPath, uploadAssetBlob } from "./storage";

export async function uploadQrAsset(
  client,
  {
    dollId,
    storageKey,
    qrSource,
    forceRefresh = false,
    fetcher = fetch,
    now = Date.now,
  } = {}
) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  if (!qrSource) {
    throw new Error("Generate a QR code first.");
  }

  if (!storageKey) {
    throw new Error("A QR storage key is required.");
  }

  const response = await fetcher(qrSource);
  const blob = await response.blob();
  const filePath = buildQrAssetPath(storageKey);
  const uploadResult = await uploadAssetBlob(client, {
    filePath,
    blob,
    contentType: "image/png",
    upsert: true,
  });
  const publicQrUrl = uploadResult.publicUrl || "";
  const storedQrUrl = publicQrUrl && forceRefresh ? `${publicQrUrl}?v=${now()}` : publicQrUrl;

  await updateDollQrCodeUrl(client, dollId, storedQrUrl);

  return {
    filePath,
    publicQrUrl,
    storedQrUrl,
  };
}
