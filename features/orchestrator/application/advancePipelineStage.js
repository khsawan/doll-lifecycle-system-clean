import { executePipelineCommand as defaultExecutePipelineCommand } from "../../production-pipeline/services/commandExecutor";
import { resolveApplicationContext } from "../shared/context";
import {
  createApplicationSuccess,
  INTERNAL_COMMAND_TYPES,
  normalizeApplicationFailure,
  validateApplicationCommand,
} from "../shared/helpers";

const noop = () => {};

export async function advancePipelineStage({ command, context } = {}) {
  const commandFailure = validateApplicationCommand(
    command,
    INTERNAL_COMMAND_TYPES.ADVANCE_PIPELINE_STAGE,
    {
      code: "INVALID_PIPELINE_STAGE_COMMAND",
      message: "Invalid pipeline stage command.",
    }
  );

  if (commandFailure) {
    return commandFailure;
  }

  const {
    executePipelineCommand,
    persistPipelineState = null,
    setRecords = null,
    syncRecord = null,
    setNotice,
    setError,
  } = resolveApplicationContext(context, {
    executePipelineCommand: defaultExecutePipelineCommand,
  });
  const safeSetNotice = typeof setNotice === "function" ? setNotice : noop;
  const safeSetError = typeof setError === "function" ? setError : noop;

  try {
    const executed = await executePipelineCommand({
      command,
      persistPipelineState,
      setRecords,
      syncRecord,
      setNotice: safeSetNotice,
      setError: safeSetError,
    });

    if (!executed) {
      return normalizeApplicationFailure(
        {
          code: "PIPELINE_STAGE_ADVANCE_FAILED",
          message: "Could not update pipeline stage.",
          retryable: true,
        },
        {
          code: "PIPELINE_STAGE_ADVANCE_FAILED",
          message: "Could not update pipeline stage.",
          retryable: true,
        }
      );
    }

    return createApplicationSuccess({
      code: "PIPELINE_STAGE_ADVANCED",
      message: "Pipeline stage updated.",
      data: {
        executed: true,
        command,
      },
    });
  } catch (error) {
    return normalizeApplicationFailure(error, {
      code: "PIPELINE_STAGE_ADVANCE_FAILED",
      message: "Could not update pipeline stage.",
      retryable: true,
    });
  }
}
