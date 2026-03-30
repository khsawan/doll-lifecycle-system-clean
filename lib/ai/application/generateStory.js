import { executeAIApplicationAction, INTERNAL_COMMAND_TYPES } from "./shared.js";

export async function generateStory({ command, context } = {}) {
  return executeAIApplicationAction({
    command,
    context,
    expectedType: INTERNAL_COMMAND_TYPES.GENERATE_STORY,
    task: "story",
    successCode: "GENERATE_STORY_COMPLETED",
    successMessage: "Story generated.",
    failureCode: "GENERATE_STORY_FAILED",
    failureMessage: "Failed to generate story.",
    invalidMessage: "Invalid story generation command.",
  });
}
