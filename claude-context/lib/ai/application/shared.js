import {
  INTERNAL_COMMAND_TYPES,
  createFailureResult,
  createSuccessResult,
  isFailureResult,
  isInternalCommandEnvelope,
  normalizeErrorResult,
  readSuccessResultData,
} from "../../shared/contracts/index.js";
import { createAIRequest } from "../domain/requests.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function readCommandMetadataString(command, key) {
  return readOptionalString(command?.metadata?.[key]);
}

function readCommandPayload(command) {
  return isPlainObject(command?.payload) ? command.payload : {};
}

function validateAIApplicationCommand(command, expectedType, message) {
  if (!isInternalCommandEnvelope(command)) {
    return createFailureResult({
      code: "INVALID_AI_GENERATION_COMMAND",
      message,
      retryable: false,
    });
  }

  if (expectedType && command.type !== expectedType) {
    return createFailureResult({
      code: "INVALID_AI_GENERATION_COMMAND",
      message,
      retryable: false,
      details: {
        expectedType,
        actualType: command.type,
      },
    });
  }

  return null;
}

async function resolveAIExecutor(context = {}) {
  const resolvedContext = isPlainObject(context) ? context : {};

  if (typeof resolvedContext.executeAIRequest === "function") {
    return async ({ provider, task, payload }) =>
      resolvedContext.executeAIRequest(
        createAIRequest({
          provider,
          task,
          payload,
        })
      );
  }

  if (typeof resolvedContext.generateAIContent === "function") {
    return resolvedContext.generateAIContent;
  }

  const runtimeModule = await import("../infrastructure/runtime.js");
  return runtimeModule.generateAIContent;
}

export async function executeAIApplicationAction({
  command,
  context,
  expectedType,
  task,
  successCode,
  successMessage,
  failureCode,
  failureMessage,
  invalidMessage,
} = {}) {
  const commandFailure = validateAIApplicationCommand(
    command,
    expectedType,
    invalidMessage || `Invalid ${task} generation command.`
  );

  if (commandFailure) {
    return commandFailure;
  }

  try {
    const execute = await resolveAIExecutor(context);
    const provider = readCommandMetadataString(command, "provider");
    const result = await execute({
      provider,
      task,
      payload: readCommandPayload(command),
    });

    if (isFailureResult(result)) {
      return normalizeErrorResult(result, {
        code: failureCode,
        message: failureMessage,
        retryable: result.retryable,
      });
    }

    const resultData = readSuccessResultData(result, {});
    const normalizedData = {
      task:
        readOptionalString(resultData?.task) || readOptionalString(result?.task) || task,
      provider:
        readOptionalString(resultData?.provider) ||
        readOptionalString(result?.provider) ||
        provider,
      result: isPlainObject(resultData?.result)
        ? resultData.result
        : isPlainObject(result?.result)
          ? result.result
          : {},
    };

    return createSuccessResult({
      code: readOptionalString(result?.code) || successCode,
      message: readOptionalString(result?.message) || successMessage,
      data: normalizedData,
      warnings: Array.isArray(result?.warnings) ? result.warnings : [],
    });
  } catch (error) {
    return normalizeErrorResult(error, {
      code: failureCode,
      message: failureMessage,
      retryable: true,
    });
  }
}

export { INTERNAL_COMMAND_TYPES };
