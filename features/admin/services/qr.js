import { uploadQrAsset } from "../../../lib/assets/infrastructure/qr";

export async function uploadAdminQrCode(client, options = {}) {
  return uploadQrAsset(client, options);
}
