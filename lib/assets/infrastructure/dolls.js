function ensureAssetClient(client) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }
}

function ensureDollId(dollId) {
  if (!dollId) {
    throw new Error("A doll id is required.");
  }
}

export async function updateDollAssetField(client, dollId, field, value) {
  ensureAssetClient(client);
  ensureDollId(dollId);

  const { error } = await client.from("dolls").update({ [field]: value }).eq("id", dollId);

  if (error) {
    throw error;
  }

  return value;
}

export async function updateDollQrCodeUrl(client, dollId, qrCodeUrl) {
  await updateDollAssetField(client, dollId, "qr_code_url", qrCodeUrl);
  return qrCodeUrl;
}

export async function updateDollImageUrl(client, dollId, imageUrl) {
  await updateDollAssetField(client, dollId, "image_url", imageUrl);
  return imageUrl;
}
