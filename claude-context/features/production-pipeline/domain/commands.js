import {
  PIPELINE_STAGE_LABELS,
  completePipelineStageTransition,
  getCurrentOpenPipelineStage,
  getDownstreamPipelineStages,
  getNextPipelineStage,
  isSamePipelineState,
  reopenPipelineStageTransition,
} from "../../../lib/pipelineState";
import {
  createAdvancePipelineStageCommand,
  createFailureResult,
  createSuccessResult,
} from "../../../lib/shared/contracts";

const DEFAULT_PIPELINE_ERROR = "Could not update pipeline stage.";

export function buildPipelineStageCompletionNotice(
  stage,
  nextStage,
  stageLabels = PIPELINE_STAGE_LABELS
) {
  return nextStage
    ? `${stageLabels[stage]} completed. ${stageLabels[nextStage]} is now open.`
    : `${stageLabels[stage]} completed.`;
}

export function buildPipelineStageReopenNotice(
  stage,
  downstreamStage,
  stageLabels = PIPELINE_STAGE_LABELS
) {
  return downstreamStage
    ? `${stageLabels[stage]} reopened. Later stages were locked.`
    : `${stageLabels[stage]} reopened.`;
}

function resolveStageReadiness({
  stage,
  readinessState,
  gatewayReadinessState,
  resolveStageReadinessState,
}) {
  if (typeof resolveStageReadinessState !== "function") {
    return null;
  }

  return resolveStageReadinessState(stage, readinessState, gatewayReadinessState);
}

export function createPipelineCompletionCommand({
  selected,
  pipelineState,
  stage,
  readinessState,
  gatewayReadinessState,
  hasPersistenceTarget = true,
  resolveStageReadinessState,
  buildBlockedMessage,
  stageLabels = PIPELINE_STAGE_LABELS,
}) {
  if (!selected) {
    return null;
  }

  if (!hasPersistenceTarget) {
    return createFailureResult({
      code: "PIPELINE_PERSISTENCE_UNAVAILABLE",
      message: DEFAULT_PIPELINE_ERROR,
    });
  }

  const openStage = getCurrentOpenPipelineStage(pipelineState);

  if (!openStage || openStage !== stage) {
    return createFailureResult({
      code: "PIPELINE_STAGE_NOT_OPEN",
      message: "Only the current open stage can be completed.",
    });
  }

  const stageReadiness = resolveStageReadiness({
    stage,
    readinessState,
    gatewayReadinessState,
    resolveStageReadinessState,
  });

  if (!stageReadiness?.complete) {
    return createFailureResult({
      code: "PIPELINE_STAGE_BLOCKED",
      message:
        typeof buildBlockedMessage === "function"
          ? buildBlockedMessage(stage, stageReadiness)
          : DEFAULT_PIPELINE_ERROR,
      details: {
        stage,
        readiness: stageReadiness,
      },
    });
  }

  const nextPipelineState = completePipelineStageTransition(pipelineState, stage);
  const nextStage = getNextPipelineStage(stage);
  const successNotice = buildPipelineStageCompletionNotice(stage, nextStage, stageLabels);
  const command = createAdvancePipelineStageCommand({
    dollId: selected.id,
    payload: {
      action: "complete",
      stage,
      nextStage,
      nextPipelineState,
      successNotice,
    },
  });

  return createSuccessResult({
    code: "PIPELINE_STAGE_ADVANCE_READY",
    message: "Pipeline stage completion command created.",
    data: {
      command,
    },
  });
}

export function createPipelineReopenCommand({
  selected,
  pipelineState,
  stage,
  hasPersistenceTarget = true,
  stageLabels = PIPELINE_STAGE_LABELS,
}) {
  if (!selected) {
    return null;
  }

  if (!hasPersistenceTarget) {
    return createFailureResult({
      code: "PIPELINE_PERSISTENCE_UNAVAILABLE",
      message: DEFAULT_PIPELINE_ERROR,
    });
  }

  const nextPipelineState = reopenPipelineStageTransition(pipelineState, stage);

  if (isSamePipelineState(nextPipelineState, pipelineState)) {
    return null;
  }

  const downstreamStage = getNextPipelineStage(stage);
  const successNotice = buildPipelineStageReopenNotice(stage, downstreamStage, stageLabels);
  const command = createAdvancePipelineStageCommand({
    dollId: selected.id,
    payload: {
      action: "reopen",
      stage,
      downstreamStage,
      nextPipelineState,
      successNotice,
    },
  });

  return createSuccessResult({
    code: "PIPELINE_STAGE_ADVANCE_READY",
    message: "Pipeline stage reopen command created.",
    data: {
      command,
    },
  });
}

export function createPipelineReopenWarning({
  selected,
  pipelineState,
  stage,
  isBusy = false,
}) {
  if (!selected || isBusy) {
    return null;
  }

  const nextPipelineState = reopenPipelineStageTransition(pipelineState, stage);

  if (isSamePipelineState(nextPipelineState, pipelineState)) {
    return null;
  }

  const affectedStages = getDownstreamPipelineStages(stage).filter((downstreamStage) => {
    const currentStatus = pipelineState?.[downstreamStage]?.status;
    const nextStatus = nextPipelineState?.[downstreamStage]?.status;

    return currentStatus !== nextStatus && nextStatus === "locked";
  });

  return {
    type: "reopen",
    stage,
    affectedStages,
  };
}
