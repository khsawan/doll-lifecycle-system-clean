export const AI_TASKS = Object.freeze({
  STORY: "story",
  CONTENT_PACK: "content_pack",
  SOCIAL: "social",
  V1_CONTENT: "v1_content",
});

export const AI_PROVIDERS = Object.freeze({
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
});

export const AI_SETTING_KEYS = Object.freeze(["ai_provider", "ai_model"]);

const AI_TASK_SET = new Set(Object.values(AI_TASKS));
const AI_PROVIDER_SET = new Set(Object.values(AI_PROVIDERS));

function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAITask(value) {
  const normalized = readOptionalString(value).toLowerCase();
  return AI_TASK_SET.has(normalized) ? normalized : "";
}

export function normalizeAIProvider(value) {
  return readOptionalString(value).toLowerCase();
}

export function normalizeAIModel(value) {
  return readOptionalString(value);
}

export function isSupportedAITask(value) {
  return Boolean(normalizeAITask(value));
}

export function isSupportedAIProvider(value) {
  return AI_PROVIDER_SET.has(normalizeAIProvider(value));
}

export function resolveAITask(value) {
  const normalized = normalizeAITask(value);

  if (!normalized) {
    throw new Error(`Unsupported AI task: ${value}`);
  }

  return normalized;
}

export function resolveAIProvider(value, fallback = AI_PROVIDERS.ANTHROPIC) {
  const normalized = normalizeAIProvider(value);

  if (normalized) {
    if (!isSupportedAIProvider(normalized)) {
      throw new Error(`Unsupported AI provider: ${normalized}`);
    }

    return normalized;
  }

  const normalizedFallback = normalizeAIProvider(fallback) || AI_PROVIDERS.ANTHROPIC;

  if (!isSupportedAIProvider(normalizedFallback)) {
    throw new Error(`Unsupported AI provider: ${normalizedFallback}`);
  }

  return normalizedFallback;
}
