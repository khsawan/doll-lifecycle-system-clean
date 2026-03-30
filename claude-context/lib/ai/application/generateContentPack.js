import { executeAIApplicationAction, INTERNAL_COMMAND_TYPES } from "./shared.js";

export async function generateContentPack({ command, context } = {}) {
  return executeAIApplicationAction({
    command,
    context,
    expectedType: INTERNAL_COMMAND_TYPES.GENERATE_CONTENT_PACK,
    task: "content_pack",
    successCode: "GENERATE_CONTENT_PACK_COMPLETED",
    successMessage: "Content pack generated.",
    failureCode: "GENERATE_CONTENT_PACK_FAILED",
    failureMessage: "Failed to generate content pack.",
    invalidMessage: "Invalid content pack generation command.",
  });
}
