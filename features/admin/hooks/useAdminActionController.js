"use client";

import { useAdminActionResetController } from "./useAdminActionResetController";
import { useAdminDangerActionController } from "./useAdminDangerActionController";
import { useAdminPipelineActionController } from "./useAdminPipelineActionController";
import { useAdminQrActionController } from "./useAdminQrActionController";

export function useAdminActionController({
  workspaceControllerState,
  editorControllerState,
  setError,
  setNotice,
}) {
  const { pipelineActionsState, clearStageActionWarning } =
    useAdminPipelineActionController({
      workspaceControllerState,
      setError,
      setNotice,
    });
  const { qrWorkflowState } = useAdminQrActionController({
    workspaceControllerState,
    setError,
    setNotice,
  });
  const { dangerZoneState } = useAdminDangerActionController({
    workspaceControllerState,
      setError,
      setNotice,
    });

  useAdminActionResetController({
    workspaceControllerState,
    editorControllerState,
    pipelineActionsState,
    qrWorkflowState,
    dangerZoneState,
  });

  return {
    pipelineActionsState,
    qrWorkflowState,
    dangerZoneState,
    clearStageActionWarning,
  };
}
