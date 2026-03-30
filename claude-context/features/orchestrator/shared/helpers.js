import {
  createFailureResult,
  createSuccessResult,
  INTERNAL_COMMAND_TYPES,
  isFailureResult,
  isInternalCommandEnvelope,
  normalizeErrorResult,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

export function validateApplicationCommand(
  command,
  expectedType,
  {
    code = "INVALID_COMMAND",
    message = "Invalid command.",
  } = {}
) {
  if (!isInternalCommandEnvelope(command)) {
    return createFailureResult({
      code,
      message,
      retryable: false,
    });
  }

  if (expectedType && command.type !== expectedType) {
    return createFailureResult({
      code,
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

export function readCommandTargetId(command) {
  return readOptionalString(command?.dollId) || readOptionalString(command?.entityId);
}

export function readCommandMetadataString(command, key) {
  return readOptionalString(command?.metadata?.[key]);
}

export function normalizeApplicationFailure(
  error,
  {
    code = "APPLICATION_ACTION_FAILED",
    message = "Application action failed.",
    retryable = false,
    details,
  } = {}
) {
  return normalizeErrorResult(error, {
    code,
    message,
    retryable,
    details,
  });
}

export function createApplicationSuccess({
  code = "APPLICATION_ACTION_COMPLETED",
  message = "Application action completed.",
  data = null,
  warnings = [],
} = {}) {
  return createSuccessResult({
    code,
    message,
    data,
    warnings,
  });
}

export function readApplicationSuccessData(result, fallback = null) {
  return readSuccessResultData(result, fallback);
}

export async function executeAIGenerationApplicationAction({
  command,
  expectedType,
  task,
  successCode,
  successMessage,
  failureCode,
  failureMessage,
  generateAIContent,
} = {}) {
  const commandFailure = validateApplicationCommand(command, expectedType, {
    code: "INVALID_AI_GENERATION_COMMAND",
    message: `Invalid ${task} generation command.`,
  });

  if (commandFailure) {
    return commandFailure;
  }

  try {
    const provider = readCommandMetadataString(command, "provider");
    const result = await generateAIContent({
      provider,
      task,
      payload: isPlainObject(command.payload) ? command.payload : {},
    });

    if (isFailureResult(result)) {
      return normalizeApplicationFailure(result, {
        code: failureCode,
        message: failureMessage,
        retryable: result.retryable,
      });
    }

    const resultData = readApplicationSuccessData(result, {});
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

    return createApplicationSuccess({
      code: readOptionalString(result?.code) || successCode,
      message: readOptionalString(result?.message) || successMessage,
      data: normalizedData,
      warnings: Array.isArray(result?.warnings) ? result.warnings : [],
    });
  } catch (error) {
    return normalizeApplicationFailure(error, {
      code: failureCode,
      message: failureMessage,
      retryable: true,
    });
  }
}

export { INTERNAL_COMMAND_TYPES };

