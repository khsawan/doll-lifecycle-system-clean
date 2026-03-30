import { INTERNAL_COMMAND_TYPES } from "../../shared/contracts/index.js";
import { AI_TASKS } from "../domain/taskRouting.js";
import { readAIServiceRuntimeConfig } from "./config.js";
import { AI_SERVICE_ERROR_CODES, normalizeAIServiceError } from "./errors.js";
import {
  createAIServiceRequestFromCommand,
  createGenerateContentPackRequest,
  createGenerateSocialRequest,
  createGenerateStoryRequest,
  readAIServiceRequestProvider,
} from "./requests.js";
import { createAIServiceSuccessResponse } from "./responses.js";
import { createAITraceMetadata } from "./trace.js";

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

function validateServiceCommandForTask(command, task) {
  const expectedType =
    task === AI_TASKS.STORY
      ? INTERNAL_COMMAND_TYPES.GENERATE_STORY
      : task === AI_TASKS.CONTENT_PACK
        ? INTERNAL_COMMAND_TYPES.GENERATE_CONTENT_PACK
        : task === AI_TASKS.SOCIAL
          ? INTERNAL_COMMAND_TYPES.GENERATE_SOCIAL
          : "";

  if (!expectedType || readOptionalString(command?.type) !== expectedType) {
    throw new Error(`Invalid ${task} generation command.`);
  }
}

function buildTaskPath(task) {
  switch (task) {
    case AI_TASKS.STORY:
      return "/generate/story";
    case AI_TASKS.CONTENT_PACK:
      return "/generate/content-pack";
    case AI_TASKS.SOCIAL:
      return "/generate/social";
    default:
      throw new Error(`Unsupported AI service task: ${task}`);
  }
}

function buildServiceUrl(baseUrl, task) {
  const normalizedBaseUrl = readOptionalString(baseUrl);

  if (!normalizedBaseUrl) {
    throw new Error("AI service base URL is required in remote mode.");
  }

  return new URL(buildTaskPath(task), normalizedBaseUrl).toString();
}

function readResponseTrace(serviceRequest, trace) {
  if (trace && typeof trace === "object" && !Array.isArray(trace)) {
    return trace;
  }

  return createAITraceMetadata({
    requestId: serviceRequest?.requestId,
    task: serviceRequest?.task,
    provider: readAIServiceRequestProvider(serviceRequest),
    dollId: serviceRequest?.dollId,
    entityId: serviceRequest?.entityId,
    metadata: serviceRequest?.metadata,
    executionMode: "remote_http",
  });
}

function createAbortController(timeoutMs) {
  if (typeof AbortController !== "function") {
    return {
      controller: null,
      cancel: () => {},
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cancel: () => clearTimeout(timeoutId),
  };
}

function readRemoteResponseFailure(
  body,
  serviceRequest,
  fallbackMessage = "AI request failed."
) {
  return normalizeAIServiceError(body, {
    requestId: readOptionalString(body?.requestId) || serviceRequest?.requestId,
    trace: readResponseTrace(serviceRequest, body?.trace),
    fallbackMessage,
  });
}

async function executeRemoteAIServiceAction({
  request,
  command,
  context,
  task,
  createRequest,
  invalidMessage,
  failureMessage,
} = {}) {
  let serviceRequest;

  try {
    if (command) {
      validateServiceCommandForTask(command, task);
      serviceRequest = createAIServiceRequestFromCommand(command, task);
    } else {
      serviceRequest = createRequest(request || {});
    }
  } catch (error) {
    const requestId =
      readOptionalString(request?.requestId) || readOptionalString(command?.metadata?.requestId);

    return normalizeAIServiceError(error, {
      requestId,
      trace: createAITraceMetadata({
        requestId,
        task,
        dollId: request?.dollId || command?.dollId,
        entityId: request?.entityId || command?.entityId,
        metadata: request?.metadata || command?.metadata,
        executionMode: "remote_http",
      }),
      fallbackCode: AI_SERVICE_ERROR_CODES.INVALID_REQUEST,
      fallbackMessage: invalidMessage,
      retryable: false,
    });
  }

  const resolvedContext = context && typeof context === "object" ? context : {};
  const config = readAIServiceRuntimeConfig(resolvedContext);

  let url;

  try {
    url = buildServiceUrl(config.baseUrl, task);
  } catch (error) {
    return normalizeAIServiceError(error, {
      requestId: serviceRequest.requestId,
      trace: createAITraceMetadata({
        requestId: serviceRequest.requestId,
        task,
        provider: readAIServiceRequestProvider(serviceRequest),
        dollId: serviceRequest.dollId,
        entityId: serviceRequest.entityId,
        metadata: serviceRequest.metadata,
        executionMode: "remote_http",
      }),
      fallbackCode: AI_SERVICE_ERROR_CODES.SETTINGS_UNAVAILABLE,
      fallbackMessage: "AI service base URL is required in remote mode.",
    });
  }

  const fetcher = typeof resolvedContext.fetcher === "function" ? resolvedContext.fetcher : fetch;
  const { controller, cancel } = createAbortController(config.timeoutMs);

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": serviceRequest.requestId,
      },
      body: JSON.stringify(serviceRequest),
      signal: controller?.signal,
    });
    const body = await response.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body) || body.ok === undefined) {
      return normalizeAIServiceError(
        {
          code: AI_SERVICE_ERROR_CODES.NORMALIZATION_FAILED,
          message: "AI service returned an invalid response.",
        },
        {
          requestId: serviceRequest.requestId,
          trace: readResponseTrace(serviceRequest),
          fallbackCode: AI_SERVICE_ERROR_CODES.NORMALIZATION_FAILED,
          fallbackMessage: failureMessage,
        }
      );
    }

    if (!response.ok || body.ok === false) {
      return readRemoteResponseFailure(body, serviceRequest, failureMessage);
    }

    return createAIServiceSuccessResponse({
      requestId: readOptionalString(body.requestId) || serviceRequest.requestId,
      code: readOptionalString(body.code) || "AI_GENERATION_COMPLETED",
      message: readOptionalString(body.message) || "AI content generated.",
      data: body.data,
      warnings: Array.isArray(body.warnings) ? body.warnings : [],
      trace: readResponseTrace(serviceRequest, body.trace),
    });
  } catch (error) {
    const isTimeout = error?.name === "AbortError";

    return normalizeAIServiceError(error, {
      requestId: serviceRequest.requestId,
      trace: createAITraceMetadata({
        requestId: serviceRequest.requestId,
        task,
        provider: readAIServiceRequestProvider(serviceRequest),
        dollId: serviceRequest.dollId,
        entityId: serviceRequest.entityId,
        metadata: serviceRequest.metadata,
        executionMode: "remote_http",
      }),
      fallbackCode: isTimeout
        ? AI_SERVICE_ERROR_CODES.PROVIDER_TIMEOUT
        : AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE,
      fallbackMessage: isTimeout ? "AI service request timed out." : failureMessage,
      retryable: true,
    });
  } finally {
    cancel();
  }
}

export function createRemoteAIService(defaultContext = {}) {
  return {
    generateStory({ request, command, context } = {}) {
      return executeRemoteAIServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        task: AI_TASKS.STORY,
        createRequest: createGenerateStoryRequest,
        invalidMessage: "Invalid story generation request.",
        failureMessage: "Failed to generate story.",
      });
    },
    generateContentPack({ request, command, context } = {}) {
      return executeRemoteAIServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        task: AI_TASKS.CONTENT_PACK,
        createRequest: createGenerateContentPackRequest,
        invalidMessage: "Invalid content pack generation request.",
        failureMessage: "Failed to generate content pack.",
      });
    },
    generateSocial({ request, command, context } = {}) {
      return executeRemoteAIServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        task: AI_TASKS.SOCIAL,
        createRequest: createGenerateSocialRequest,
        invalidMessage: "Invalid social generation request.",
        failureMessage: "Failed to generate social content.",
      });
    },
  };
}
