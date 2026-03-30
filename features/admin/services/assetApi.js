import {
  createGenerateQrCommand,
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

export async function uploadAdminDollImageViaApi(fetcher, dollId, file) {
  if (!fetcher) {
    throw new Error("Could not upload image.");
  }

  const formData = new FormData();
  formData.set("file", file);

  const response = await fetcher(`/api/admin/dolls/${encodeURIComponent(dollId)}/image`, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(readFailureResultMessage(body, "Could not upload image."));
  }

  return {
    filePath: typeof data?.filePath === "string" ? data.filePath : "",
    publicImageUrl: typeof data?.publicImageUrl === "string" ? data.publicImageUrl : "",
  };
}

export async function uploadAdminQrCodeViaApi(
  fetcher,
  dollId,
  { storageKey, qrSource, forceRefresh = false } = {}
) {
  if (!fetcher) {
    throw new Error("Could not upload QR code.");
  }

  const command = createGenerateQrCommand({
    dollId,
    payload: {
      storageKey,
      qrSource,
      forceRefresh,
    },
  });

  const response = await fetcher(`/api/admin/dolls/${encodeURIComponent(dollId)}/qr`, {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(command.payload),
  });
  const body = await response.json().catch(() => ({}));
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(readFailureResultMessage(body, "Could not upload QR code."));
  }

  return {
    filePath: typeof data?.filePath === "string" ? data.filePath : "",
    publicQrUrl: typeof data?.publicQrUrl === "string" ? data.publicQrUrl : "",
    storedQrUrl: typeof data?.storedQrUrl === "string" ? data.storedQrUrl : "",
  };
}
