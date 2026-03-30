import { createAIRequest, resolveAIExecutionRequest } from "../domain/requests.js";
import { normalizeAIExecutionResult } from "../domain/results.js";
import { buildPromptForTask } from "./prompts.js";
import { executeAIProviderRequest } from "./providers.js";
import { loadAISettings } from "./settings.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

let hasLoggedAIProviderEnv = false;

function readConfiguredProvider(value) {
  return readOptionalString(value).toLowerCase();
}

function logAIProviderEnv(env) {
  if (hasLoggedAIProviderEnv) {
    return;
  }

  const resolvedEnv = isPlainObject(env) ? env : process.env;
  const provider = readConfiguredProvider(resolvedEnv.AI_PROVIDER);
  const hasGoogleKey = readOptionalString(resolvedEnv.GOOGLE_AI_API_KEY).length >= 10;

  if (!provider && !hasGoogleKey) {
    return;
  }

  console.log("AI_PROVIDER:", provider || "(unset)");
  console.log("HAS GOOGLE KEY:", hasGoogleKey);
  hasLoggedAIProviderEnv = true;
}

export function resolveRuntimeAISettings(settings, env = process.env) {
  const resolvedSettings = isPlainObject(settings) ? { ...settings } : {};
  const resolvedEnv = isPlainObject(env) ? env : process.env;
  const envProvider = readConfiguredProvider(resolvedEnv.AI_PROVIDER);
  const envModel = readOptionalString(resolvedEnv.AI_MODEL);
  const storedProvider = readConfiguredProvider(resolvedSettings.ai_provider);

  if (envProvider) {
    resolvedSettings.ai_provider = envProvider;

    if (!envModel && envProvider !== storedProvider) {
      resolvedSettings.ai_model = "";
    }
  }

  if (envModel) {
    resolvedSettings.ai_model = envModel;
  }

  return resolvedSettings;
}

export function readAIProviderResponseText(response) {
  const text =
    typeof response === "string"
      ? response
      : isPlainObject(response)
        ? readOptionalString(response.text)
        : "";

  if (!text) {
    throw new Error("AI provider returned an empty response.");
  }

  return text;
}

export async function executeAIRequest(request, context = {}) {
  const settings =
    typeof context.loadAISettings === "function"
      ? await context.loadAISettings()
      : await loadAISettings();
  const env = isPlainObject(context?.env) ? context.env : process.env;
  logAIProviderEnv(env);
  const runtimeSettings = resolveRuntimeAISettings(settings, env);
  const resolvedRequest = resolveAIExecutionRequest(request, runtimeSettings);
  const buildPrompt =
    typeof context.buildPromptForTask === "function"
      ? context.buildPromptForTask
      : buildPromptForTask;
  const executeProvider =
    typeof context.executeAIProviderRequest === "function"
      ? context.executeAIProviderRequest
      : executeAIProviderRequest;
  const normalizeResult =
    typeof context.normalizeAIExecutionResult === "function"
      ? context.normalizeAIExecutionResult
      : normalizeAIExecutionResult;
  const prompt = buildPrompt(resolvedRequest.task, resolvedRequest.payload || {});
  const providerResponse = await executeProvider({
    provider: resolvedRequest.provider,
    prompt,
    task: resolvedRequest.task,
    model: resolvedRequest.model,
  });
  const responseText = readAIProviderResponseText(providerResponse);

  return normalizeResult({
    provider: resolvedRequest.provider,
    task: resolvedRequest.task,
    responseText,
  });
}

export async function generateAIContent({ provider, task, payload, model } = {}, context = {}) {
  const request = createAIRequest({
    provider,
    task,
    payload,
    model,
  });

  return executeAIRequest(request, context);
}
