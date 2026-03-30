import { applyPipelineCommandToRecords } from "./recordSync";
import { normalizeErrorResult } from "../../../lib/shared/contracts";

const DEFAULT_PIPELINE_ERROR = "Could not update pipeline stage.";

export async function executePipelineCommand({
  command,
  persistPipelineState,
  setRecords,
  syncRecord,
  setNotice,
  setError,
}) {
  if (!command || typeof persistPipelineState !== "function") {
    return false;
  }

  try {
    const commandPayload =
      command?.payload &&
      typeof command.payload === "object" &&
      !Array.isArray(command.payload)
        ? command.payload
        : {};
    const nextPipelineState =
      commandPayload?.nextPipelineState &&
      typeof commandPayload.nextPipelineState === "object" &&
      !Array.isArray(commandPayload.nextPipelineState)
        ? commandPayload.nextPipelineState
        : null;

    if (!nextPipelineState) {
      throw new Error(DEFAULT_PIPELINE_ERROR);
    }

    const result = await persistPipelineState(command.dollId, nextPipelineState);
    const persisted = typeof result?.persisted === "boolean" ? result.persisted : true;
    const pipelineState =
      result?.pipelineState &&
      typeof result.pipelineState === "object" &&
      !Array.isArray(result.pipelineState)
        ? result.pipelineState
        : nextPipelineState;

    if (typeof setRecords === "function") {
      setRecords((previousRecords) =>
        applyPipelineCommandToRecords(previousRecords, {
          dollId: command.dollId,
          pipelineState,
          persisted,
          syncRecord,
        })
      );
    }

    setNotice(
      typeof commandPayload.successNotice === "string" ? commandPayload.successNotice : ""
    );
    return true;
  } catch (error) {
    const failure = normalizeErrorResult(error, {
      code: "PIPELINE_COMMAND_EXECUTION_FAILED",
      message: DEFAULT_PIPELINE_ERROR,
      retryable: true,
    });

    setError(failure.message);
    return false;
  }
}
