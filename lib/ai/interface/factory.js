import { sanitizeTransportObject } from "./transport.js";
import { AI_SERVICE_MODES, readAIServiceRuntimeConfig } from "./config.js";
import { AI_SERVICE_ERROR_CODES } from "./errors.js";
import { createInProcessAIService } from "./service.js";
import { createRemoteAIService } from "./remote.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeServiceContext(defaultContext, overrideContext) {
  const resolvedDefaultContext = isPlainObject(defaultContext) ? defaultContext : {};
  const resolvedOverrideContext = isPlainObject(overrideContext) ? overrideContext : {};

  return {
    ...resolvedDefaultContext,
    ...resolvedOverrideContext,
  };
}

function isFallbackEligible(result) {
  if (!result || result.ok !== false) {
    return false;
  }

  return [
    AI_SERVICE_ERROR_CODES.SETTINGS_UNAVAILABLE,
    AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE,
    AI_SERVICE_ERROR_CODES.PROVIDER_TIMEOUT,
    AI_SERVICE_ERROR_CODES.INTERNAL_ERROR,
  ].includes(result.code);
}

function attachFallbackMetadata(localResult, remoteResult) {
  const warnings = Array.isArray(localResult?.warnings) ? [...localResult.warnings] : [];
  warnings.push("Remote AI service failed; local fallback used.");
  const trace = sanitizeTransportObject(
    {
      ...(localResult?.trace || {}),
      primaryMode: AI_SERVICE_MODES.REMOTE,
      fallbackMode: AI_SERVICE_MODES.LOCAL,
      remoteErrorCode: remoteResult?.code,
    },
    {}
  );

  return {
    ...localResult,
    warnings,
    trace,
  };
}

async function executeConfiguredAIServiceAction(actionName, input = {}, defaultContext = {}) {
  const mergedContext = mergeServiceContext(defaultContext, input?.context);
  const config = readAIServiceRuntimeConfig(mergedContext);
  const localService =
    mergedContext.localAIService ||
    createInProcessAIService({
      ...mergedContext,
      aiServiceMode: AI_SERVICE_MODES.LOCAL,
    });

  if (config.mode !== AI_SERVICE_MODES.REMOTE) {
    return localService[actionName](input);
  }

  const remoteService =
    mergedContext.remoteAIService ||
    createRemoteAIService({
      ...mergedContext,
      aiServiceMode: AI_SERVICE_MODES.REMOTE,
    });
  const remoteResult = await remoteService[actionName](input);

  if (
    remoteResult?.ok === false &&
    config.allowLocalFallback &&
    isFallbackEligible(remoteResult)
  ) {
    const localResult = await localService[actionName](input);

    if (localResult?.ok === true) {
      return attachFallbackMetadata(localResult, remoteResult);
    }

    return localResult;
  }

  return remoteResult;
}

export function createConfiguredAIService(defaultContext = {}) {
  return {
    generateStory(input = {}) {
      return executeConfiguredAIServiceAction("generateStory", input, defaultContext);
    },
    generateContentPack(input = {}) {
      return executeConfiguredAIServiceAction("generateContentPack", input, defaultContext);
    },
    generateSocial(input = {}) {
      return executeConfiguredAIServiceAction("generateSocial", input, defaultContext);
    },
  };
}

const configuredAIService = createConfiguredAIService();

export function generateStory(input = {}) {
  return configuredAIService.generateStory(input);
}

export function generateContentPack(input = {}) {
  return configuredAIService.generateContentPack(input);
}

export function generateSocial(input = {}) {
  return configuredAIService.generateSocial(input);
}
