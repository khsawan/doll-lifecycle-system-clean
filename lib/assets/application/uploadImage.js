import { createFailureResult, createSuccessResult } from "../../shared/contracts";
import { createUploadImageExecutionRequest } from "../domain/requests";
import { normalizeUploadImageResult } from "../domain/results";

async function resolveImageDependencies(context = {}) {
  if (
    typeof context.createAdminStoreClient === "function" &&
    typeof context.uploadAssetFile === "function" &&
    typeof context.buildDollImageAssetPath === "function" &&
    typeof context.updateDollImageUrl === "function"
  ) {
    return {
      createAdminStoreClient: context.createAdminStoreClient,
      uploadAssetFile: context.uploadAssetFile,
      buildDollImageAssetPath: context.buildDollImageAssetPath,
      updateDollImageUrl: context.updateDollImageUrl,
    };
  }

  const [{ createAdminStoreClient }, storageModule, dollsModule] = await Promise.all([
    import("../../../features/admin/services/store.js"),
    import("../infrastructure/storage.js"),
    import("../infrastructure/dolls.js"),
  ]);

  return {
    createAdminStoreClient:
      typeof context.createAdminStoreClient === "function"
        ? context.createAdminStoreClient
        : createAdminStoreClient,
    uploadAssetFile:
      typeof context.uploadAssetFile === "function"
        ? context.uploadAssetFile
        : storageModule.uploadAssetFile,
    buildDollImageAssetPath:
      typeof context.buildDollImageAssetPath === "function"
        ? context.buildDollImageAssetPath
        : storageModule.buildDollImageAssetPath,
    updateDollImageUrl:
      typeof context.updateDollImageUrl === "function"
        ? context.updateDollImageUrl
        : dollsModule.updateDollImageUrl,
  };
}

export async function uploadImage({ request, context } = {}) {
  let executionRequest;

  try {
    executionRequest = createUploadImageExecutionRequest(request);
  } catch (error) {
    return createFailureResult({
      code: "INVALID_IMAGE_UPLOAD_REQUEST",
      message: error instanceof Error ? error.message : "Invalid image upload request.",
      retryable: false,
    });
  }

  const resolvedContext = context && typeof context === "object" ? context : {};
  const {
    createAdminStoreClient,
    uploadAssetFile,
    buildDollImageAssetPath,
    updateDollImageUrl,
  } = await resolveImageDependencies(resolvedContext);

  try {
    const client = createAdminStoreClient();
    const filePath = buildDollImageAssetPath({
      dollId: executionRequest.dollId,
      fileName: executionRequest.file.name,
      now: resolvedContext.now || Date.now,
    });
    const uploadResult = await uploadAssetFile(client, {
      filePath,
      file: executionRequest.file,
      upsert: true,
    });
    const publicImageUrl = uploadResult.publicUrl || "";

    await updateDollImageUrl(client, executionRequest.dollId, publicImageUrl);

    return createSuccessResult({
      code: "IMAGE_UPLOADED",
      message: "Image uploaded.",
      data: normalizeUploadImageResult({
        filePath,
        publicImageUrl,
      }),
    });
  } catch (error) {
    return createFailureResult({
      code: "IMAGE_UPLOAD_FAILED",
      message: error instanceof Error ? error.message : "Failed to upload image.",
      retryable: true,
    });
  }
}
