import {
  INTERNAL_COMMAND_TYPES,
  createGenerateContentPackCommand,
  createGenerateSocialCommand,
  createGenerateStoryCommand,
  readSuccessResultData,
} from "../../shared/contracts/index.js";
import {
  generateContentPack as generateContentPackApplication,
  generateSocial as generateSocialApplication,
  generateStory as generateStoryApplication,
} from "../application/index.js";
import { AI_TASKS } from "../domain/taskRouting.js";
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

function buildAIApplicationCommand(task, request) {
  const metadata = isPlainObject(request?.metadata) ? { ...request.metadata } : {};

  if (request?.requestId && !readOptionalString(metadata.requestId)) {
    metadata.requestId = request.requestId;
  }

  switch (task) {
    case AI_TASKS.STORY:
      return createGenerateStoryCommand({
        dollId: request?.dollId,
        entityId: request?.entityId,
        payload: request?.payload,
        metadata,
      });
    case AI_TASKS.CONTENT_PACK:
      return createGenerateContentPackCommand({
        dollId: request?.dollId,
        entityId: request?.entityId,
        payload: request?.payload,
        metadata,
      });
    case AI_TASKS.SOCIAL:
      return createGenerateSocialCommand({
        dollId: request?.dollId,
        entityId: request?.entityId,
        payload: request?.payload,
        metadata,
      });
    default:
      throw new Error(`Unsupported AI service task: ${task}`);
  }
}

function createSuccessTrace(request, data) {
  return createAITraceMetadata({
    requestId: request?.requestId,
    task: readOptionalString(data?.task) || request?.task,
    provider: readOptionalString(data?.provider) || readAIServiceRequestProvider(request),
    dollId: request?.dollId,
    entityId: request?.entityId,
    metadata: request?.metadata,
  });
}

async function executeAIServiceAction({
  request,
  command,
  context,
  task,
  createRequest,
  executeApplication,
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
    return normalizeAIServiceError(error, {
      requestId: readOptionalString(request?.requestId) || readOptionalString(command?.metadata?.requestId),
      trace: createAITraceMetadata({
        requestId: readOptionalString(request?.requestId) || readOptionalString(command?.metadata?.requestId),
        task,
        dollId: request?.dollId || command?.dollId,
        entityId: request?.entityId || command?.entityId,
        metadata: request?.metadata || command?.metadata,
      }),
      fallbackCode: AI_SERVICE_ERROR_CODES.INVALID_REQUEST,
      fallbackMessage: invalidMessage,
      retryable: false,
    });
  }

  try {
    const result = await executeApplication({
      command: buildAIApplicationCommand(task, serviceRequest),
      context,
    });

    if (result?.ok === false) {
      return normalizeAIServiceError(result, {
        requestId: serviceRequest.requestId,
        trace: createAITraceMetadata({
          requestId: serviceRequest.requestId,
          task,
          provider: readAIServiceRequestProvider(serviceRequest),
          dollId: serviceRequest.dollId,
          entityId: serviceRequest.entityId,
          metadata: serviceRequest.metadata,
        }),
        fallbackMessage: failureMessage,
      });
    }

    const data = readSuccessResultData(result, {});

    return createAIServiceSuccessResponse({
      requestId: serviceRequest.requestId,
      code: readOptionalString(result?.code) || "AI_GENERATION_COMPLETED",
      message: readOptionalString(result?.message) || "AI content generated.",
      data: {
        task: readOptionalString(data?.task) || task,
        provider:
          readOptionalString(data?.provider) || readAIServiceRequestProvider(serviceRequest),
        result: isPlainObject(data?.result) ? data.result : {},
      },
      warnings: Array.isArray(result?.warnings) ? result.warnings : [],
      trace: createSuccessTrace(serviceRequest, data),
    });
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
      }),
      fallbackMessage: failureMessage,
    });
  }
}

export function createInProcessAIService(defaultContext = {}) {
  return {
    generateStory({ request, command, context } = {}) {
      return executeAIServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        task: AI_TASKS.STORY,
        createRequest: createGenerateStoryRequest,
        executeApplication:
          defaultContext.generateStoryApplication || generateStoryApplication,
        invalidMessage: "Invalid story generation request.",
        failureMessage: "Failed to generate story.",
      });
    },
    generateContentPack({ request, command, context } = {}) {
      return executeAIServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        task: AI_TASKS.CONTENT_PACK,
        createRequest: createGenerateContentPackRequest,
        executeApplication:
          defaultContext.generateContentPackApplication || generateContentPackApplication,
        invalidMessage: "Invalid content pack generation request.",
        failureMessage: "Failed to generate content pack.",
      });
    },
    generateSocial({ request, command, context } = {}) {
      return executeAIServiceAction({
        request,
        command,
        context: mergeServiceContext(defaultContext, context),
        task: AI_TASKS.SOCIAL,
        createRequest: createGenerateSocialRequest,
        executeApplication:
          defaultContext.generateSocialApplication || generateSocialApplication,
        invalidMessage: "Invalid social generation request.",
        failureMessage: "Failed to generate social content.",
      });
    },
  };
}

const inProcessAIService = createInProcessAIService();

export function generateStory(input = {}) {
  return inProcessAIService.generateStory(input);
}

export function generateContentPack(input = {}) {
  return inProcessAIService.generateContentPack(input);
}

export function generateSocial(input = {}) {
  return inProcessAIService.generateSocial(input);
}
