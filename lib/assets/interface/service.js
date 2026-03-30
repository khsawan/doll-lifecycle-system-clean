import { INTERNAL_COMMAND_TYPES, readSuccessResultData } from "../../shared/contracts";
import { generateQr as generateQrApplication, uploadImage as uploadImageApplication } from "../application";
import { ASSET_KINDS, ASSET_OPERATIONS } from "../domain/assetKinds";
import { ASSET_SERVICE_ERROR_CODES, normalizeAssetServiceError } from "./errors";
import {
  createAssetServiceRequestFromCommand,
  createGenerateQrRequest,
  createUploadImageRequest,
} from "./requests";
import { createAssetServiceSuccessResponse } from "./responses";
import { createAssetTraceMetadata } from "./trace";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function mergeServiceContext(defaultContext, overrideContext) {
  const resolvedDefaultContext = isPlainObject(defaultContext) ? defaultContext : {};
  const resolvedOverrideContext = isPlainObject(overrideContext) ? overrideContext : {};

  return {
    ...resolvedDefaultContext,
    ...resolvedOverrideContext,
  };
}

function readAssetKindForOperation(operation) {
  switch (operation) {
    case ASSET_OPERATIONS.GENERATE_QR:
      return ASSET_KINDS.QR;
    case ASSET_OPERATIONS.UPLOAD_IMAGE:
      return ASSET_KINDS.IMAGE;
    default:
      return "";
  }
}

function validateServiceCommandForOperation(command, operation) {
  const expectedType =
    operation === ASSET_OPERATIONS.GENERATE_QR ? INTERNAL_COMMAND_TYPES.GENERATE_QR : "";

  if (!expectedType || readOptionalString(command?.type) !== expectedType) {
    throw new Error("Invalid QR generation command.");
  }
}

function createTraceFromRequest(request) {
  return createAssetTraceMetadata({
    requestId: request?.requestId,
    operation: request?.operation,
    assetKind: readAssetKindForOperation(request?.operation),
    dollId: request?.dollId,
    entityId: request?.entityId,
    metadata: request?.metadata,
  });
}

async function executeAssetServiceAction({
  request,
  command,
  context,
  operation,
  createRequest,
  executeApplication,
  invalidMessage,
  failureMessage,
} = {}) {
  let serviceRequest;

  try {
    if (command !== undefined) {
      validateServiceCommandForOperation(command, operation);
      serviceRequest = createAssetServiceRequestFromCommand(command, operation);
    } else {
      serviceRequest = createRequest(request || {});
    }
  } catch (error) {
    const requestId =
      readOptionalString(request?.requestId) || readOptionalString(command?.metadata?.requestId);

    return normalizeAssetServiceError(error, {
      requestId,
      trace: createAssetTraceMetadata({
        requestId,
        operation,
        assetKind: readAssetKindForOperation(operation),
        dollId: request?.dollId || command?.dollId,
        entityId: request?.entityId || command?.entityId,
        metadata: request?.metadata || command?.metadata,
      }),
      fallbackCode: ASSET_SERVICE_ERROR_CODES.INVALID_REQUEST,
      fallbackMessage: invalidMessage,
      retryable: false,
    });
  }

  try {
    const result = await executeApplication({
      request: serviceRequest,
      context,
    });

    if (result?.ok === false) {
      return normalizeAssetServiceError(result, {
        requestId: serviceRequest.requestId,
        trace: createTraceFromRequest(serviceRequest),
        fallbackMessage: failureMessage,
      });
    }

    return createAssetServiceSuccessResponse({
      requestId: serviceRequest.requestId,
      code: readOptionalString(result?.code) || "ASSET_OPERATION_COMPLETED",
      message: readOptionalString(result?.message) || "Asset operation completed.",
      data: readSuccessResultData(result, {}),
      warnings: Array.isArray(result?.warnings) ? result.warnings : [],
      trace: createTraceFromRequest(serviceRequest),
    });
  } catch (error) {
    return normalizeAssetServiceError(error, {
      requestId: serviceRequest.requestId,
      trace: createTraceFromRequest(serviceRequest),
      fallbackMessage: failureMessage,
    });
  }
}

export function createInProcessAssetService(defaultContext = {}) {
  return {
    generateQr({ request, command, context } = {}) {
      return executeAssetServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        operation: ASSET_OPERATIONS.GENERATE_QR,
        createRequest: createGenerateQrRequest,
        executeApplication: defaultContext.generateQrApplication || generateQrApplication,
        invalidMessage: "Invalid QR generation request.",
        failureMessage: "Failed to upload QR code.",
      });
    },
    uploadImage({ request, context } = {}) {
      return executeAssetServiceAction({
        request,
        context: mergeServiceContext(defaultContext, context),
        operation: ASSET_OPERATIONS.UPLOAD_IMAGE,
        createRequest: createUploadImageRequest,
        executeApplication: defaultContext.uploadImageApplication || uploadImageApplication,
        invalidMessage: "Invalid image upload request.",
        failureMessage: "Failed to upload image.",
      });
    },
  };
}

const inProcessAssetService = createInProcessAssetService();

export function generateQr(input = {}) {
  return inProcessAssetService.generateQr(input);
}

export function uploadImage(input = {}) {
  return inProcessAssetService.uploadImage(input);
}
