import { createFailureResult, createSuccessResult } from "../../shared/contracts";
import { createGenerateQrExecutionRequest } from "../domain/requests";
import { normalizeGenerateQrResult } from "../domain/results";

async function resolveQrDependencies(context = {}) {
  const contextUploadQrAsset =
    typeof context.uploadQrAsset === "function"
      ? context.uploadQrAsset
      : typeof context.uploadAdminQrCode === "function"
        ? context.uploadAdminQrCode
        : null;

  if (typeof context.createAdminStoreClient === "function" && contextUploadQrAsset) {
    return {
      createAdminStoreClient: context.createAdminStoreClient,
      uploadQrAsset: contextUploadQrAsset,
    };
  }

  const [{ createAdminStoreClient }, { uploadQrAsset }] = await Promise.all([
    import("../../../features/admin/services/store.js"),
    import("../infrastructure/qr.js"),
  ]);

  return {
    createAdminStoreClient:
      typeof context.createAdminStoreClient === "function"
        ? context.createAdminStoreClient
        : createAdminStoreClient,
    uploadQrAsset:
      typeof context.uploadQrAsset === "function"
        ? context.uploadQrAsset
        : typeof context.uploadAdminQrCode === "function"
          ? context.uploadAdminQrCode
          : uploadQrAsset,
  };
}

export async function generateQr({ request, context } = {}) {
  let executionRequest;

  try {
    executionRequest = createGenerateQrExecutionRequest(request);
  } catch (error) {
    return createFailureResult({
      code: "INVALID_QR_GENERATION_COMMAND",
      message: error instanceof Error ? error.message : "Invalid QR generation request.",
      retryable: false,
    });
  }

  const resolvedContext = context && typeof context === "object" ? context : {};
  const { createAdminStoreClient, uploadQrAsset } = await resolveQrDependencies(resolvedContext);

  try {
    const client = createAdminStoreClient();
    const result = await uploadQrAsset(client, {
      dollId: executionRequest.dollId,
      storageKey: executionRequest.storageKey,
      qrSource: executionRequest.qrSource,
      forceRefresh: executionRequest.forceRefresh,
      fetcher: resolvedContext.fetcher || fetch,
      now: resolvedContext.now || Date.now,
    });

    return createSuccessResult({
      code: "QR_GENERATED",
      message: "QR code uploaded.",
      data: normalizeGenerateQrResult(result),
    });
  } catch (error) {
    return createFailureResult({
      code: "QR_UPLOAD_FAILED",
      message: error instanceof Error ? error.message : "Failed to upload QR code.",
      retryable: true,
    });
  }
}
