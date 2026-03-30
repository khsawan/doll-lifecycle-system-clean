import { AI_PROVIDERS } from "../domain/taskRouting.js";
import { generateWithAnthropic } from "../providers/anthropic.js";
import { generateWithGoogle } from "./providers/google.js";

const AI_PROVIDER_EXECUTORS = Object.freeze({
  [AI_PROVIDERS.ANTHROPIC]: generateWithAnthropic,
  [AI_PROVIDERS.GOOGLE]: generateWithGoogle,
});

export async function executeAIProviderRequest({ provider, prompt, task, model }) {
  const execute = AI_PROVIDER_EXECUTORS[provider];

  if (!execute) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return execute({
    prompt,
    task,
    model,
  });
}
