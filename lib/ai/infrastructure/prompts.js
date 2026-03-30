import { AI_TASKS } from "../domain/taskRouting.js";
import { buildContentPackPrompt } from "../prompts/contentPack.js";
import { buildSocialPrompt } from "../prompts/social.js";
import { buildStoryPrompt } from "../prompts/story.js";
import { buildV1ContentPrompt } from "../prompts/v1Content.js";

export function buildPromptForTask(task, payload = {}) {
  switch (task) {
    case AI_TASKS.STORY:
      return buildStoryPrompt(payload);
    case AI_TASKS.CONTENT_PACK:
      return buildContentPackPrompt(payload);
    case AI_TASKS.SOCIAL:
      return buildSocialPrompt(payload);
    case AI_TASKS.V1_CONTENT:
      return buildV1ContentPrompt(payload);
    default:
      throw new Error(`Unsupported AI task: ${task}`);
  }
}
