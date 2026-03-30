"use client";

import { useAdminPipelineActions } from "./useAdminPipelineActions";

export function useAdminPipelineActionController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, workspaceViewState } = workspaceControllerState;
  const pipelineActionsState = useAdminPipelineActions({
    selected: catalogState.selected,
    selectedPipelineState: workspaceViewState.selectedPipelineState,
    selectedReadiness: workspaceViewState.selectedReadiness,
    gatewayReadinessState: workspaceViewState.gatewayReadinessState,
    setDolls: catalogState.setDolls,
    setError,
    setNotice,
  });

  return {
    pipelineActionsState,
    clearStageActionWarning: () => pipelineActionsState.setStageActionWarning(null),
  };
}
