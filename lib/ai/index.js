import "server-only";

import { normalizeAIResponse } from "./normalize";
import { buildContentPackPrompt } from "./prompts/contentPack";
import { buildSocialPrompt } from "./prompts/social";
import { buildStoryPrompt } from "./prompts/story";
import { generateWithAnthropic } from "./providers/anthropic";

export async function generateAIContent({ provider, task, payload }) {
  let prompt = "";

  switch (task) {
    case "story":
      prompt = buildStoryPrompt(payload || {});
      break;
    case "content_pack":
      prompt = buildContentPackPrompt(payload || {});
      break;
    case "social":
      prompt = buildSocialPrompt(payload || {});
      break;
    default:
      throw new Error(`Unsupported AI task: ${task}`);
  }

  let responseText = "";

  switch (provider) {
    case "anthropic":
      responseText = await generateWithAnthropic({ prompt, task });
      break;
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return normalizeAIResponse({
    provider,
    task,
    responseText,
  });
}
