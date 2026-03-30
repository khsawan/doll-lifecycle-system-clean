import {
  AI_PROVIDERS,
  normalizeAIModel,
  normalizeAIProvider,
  resolveAITask,
} from "./taskRouting.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeAIPayload(value) {
  return isPlainObject(value) ? { ...value } : {};
}

export function createAIRequest({ provider, task, payload, model } = {}) {
  return {
    task: resolveAITask(task),
    provider: normalizeAIProvider(provider),
    payload: normalizeAIPayload(payload),
    model: normalizeAIModel(model),
  };
}

export function resolveAIExecutionRequest(request, settings = {}) {
  const resolvedTask = resolveAITask(request?.task);
  const resolvedProvider =
    normalizeAIProvider(request?.provider) ||
    normalizeAIProvider(settings?.ai_provider) ||
    AI_PROVIDERS.ANTHROPIC;
  const resolvedModel =
    normalizeAIModel(request?.model) || normalizeAIModel(settings?.ai_model);

  return {
    task: resolvedTask,
    provider: resolvedProvider,
    payload: normalizeAIPayload(request?.payload),
    model: resolvedModel,
  };
}
