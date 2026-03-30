"use client";

import { useState } from "react";
import {
  createPipelineCompletionCommand,
  createPipelineReopenCommand,
  createPipelineReopenWarning,
} from "../domain/commands";
import { readFailureResultMessage, readSuccessResultData } from "../../../lib/shared/contracts";
import { advancePipelineStage } from "../../orchestrator/application/advancePipelineStage";

export function useProductionPipelineOrchestrator({
  selected,
  pipelineState,
  readinessState,
  gatewayReadinessState,
  setRecords,
  syncRecord,
  persistPipelineState,
  setError,
  setNotice,
  resolveStageReadinessState,
  buildBlockedMessage,
  createCompletionCommand = createPipelineCompletionCommand,
  createReopenCommand = createPipelineReopenCommand,
  createReopenStageWarning = createPipelineReopenWarning,
  runPipelineStageAction = advancePipelineStage,
}) {
  const [pipelineStageCompleting, setPipelineStageCompleting] = useState("");
  const [pipelineStageReopening, setPipelineStageReopening] = useState("");
  const [stageActionWarning, setStageActionWarning] = useState(null);
  const pipelineStageActionBusy = Boolean(pipelineStageCompleting || pipelineStageReopening);

  async function completePipelineStage(stage) {
    const completionResult = createCompletionCommand({
      selected,
      pipelineState,
      stage,
      readinessState,
      gatewayReadinessState,
      hasPersistenceTarget: typeof persistPipelineState === "function",
      resolveStageReadinessState,
      buildBlockedMessage,
    });

    if (!completionResult) {
      return;
    }

    if (!completionResult.ok) {
      setError(readFailureResultMessage(completionResult, "Could not update pipeline stage."));
      return;
    }

    const completionData = readSuccessResultData(completionResult, {});
    const completionCommand = completionData?.command || null;

    if (!completionCommand) {
      setError("Could not update pipeline stage.");
      return;
    }

    setError("");
    setNotice("");
    setPipelineStageCompleting(stage);

    try {
      const result = await runPipelineStageAction({
        command: completionCommand,
        context: {
          persistPipelineState,
          setRecords,
          syncRecord,
          setNotice,
          setError,
        },
      });

      if (!result?.ok) {
        setError(readFailureResultMessage(result, "Could not update pipeline stage."));
      }
    } finally {
      setPipelineStageCompleting("");
    }
  }

  async function reopenPipelineStage(stage) {
    const reopenResult = createReopenCommand({
      selected,
      pipelineState,
      stage,
      hasPersistenceTarget: typeof persistPipelineState === "function",
    });

    if (!reopenResult) {
      return;
    }

    if (!reopenResult.ok) {
      setError(readFailureResultMessage(reopenResult, "Could not update pipeline stage."));
      return;
    }

    const reopenData = readSuccessResultData(reopenResult, {});
    const reopenCommand = reopenData?.command || null;

    if (!reopenCommand) {
      setError("Could not update pipeline stage.");
      return;
    }

    setError("");
    setNotice("");
    setPipelineStageReopening(stage);

    try {
      const result = await runPipelineStageAction({
        command: reopenCommand,
        context: {
          persistPipelineState,
          setRecords,
          syncRecord,
          setNotice,
          setError,
        },
      });

      if (!result?.ok) {
        setError(readFailureResultMessage(result, "Could not update pipeline stage."));
      }
    } finally {
      setPipelineStageReopening("");
    }
  }

  function requestReopenPipelineStage(stage) {
    const warning = createReopenStageWarning({
      selected,
      pipelineState,
      stage,
      isBusy: pipelineStageActionBusy,
    });

    if (!warning) {
      return;
    }

    setStageActionWarning(warning);
  }

  async function confirmStageActionWarning() {
    const warning = stageActionWarning;

    if (!warning) {
      return;
    }

    setStageActionWarning(null);

    if (warning.type === "reopen") {
      await reopenPipelineStage(warning.stage);
    }
  }

  return {
    pipelineStageCompleting,
    setPipelineStageCompleting,
    pipelineStageReopening,
    setPipelineStageReopening,
    stageActionWarning,
    setStageActionWarning,
    pipelineStageActionBusy,
    completePipelineStage,
    reopenPipelineStage,
    requestReopenPipelineStage,
    confirmStageActionWarning,
  };
}
