import { executeAIApplicationAction, INTERNAL_COMMAND_TYPES } from "./shared.js";

export async function generateSocial({ command, context } = {}) {
  return executeAIApplicationAction({
    command,
    context,
    expectedType: INTERNAL_COMMAND_TYPES.GENERATE_SOCIAL,
    task: "social",
    successCode: "GENERATE_SOCIAL_COMPLETED",
    successMessage: "Social content generated.",
    failureCode: "GENERATE_SOCIAL_FAILED",
    failureMessage: "Failed to generate social content.",
    invalidMessage: "Invalid social generation command.",
  });
}
