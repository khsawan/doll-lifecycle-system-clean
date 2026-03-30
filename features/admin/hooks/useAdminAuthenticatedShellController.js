"use client";

import { useAdminAuthenticatedShellState } from "./useAdminAuthenticatedShellState";
import { useAdminShellCompositionController } from "./useAdminShellCompositionController";
import { useAdminShellFeedbackController } from "./useAdminShellFeedbackController";

export function useAdminAuthenticatedShellController({
  authChecked,
  adminProtectionEnabled,
  isAuthenticated,
  handleLogout,
  adminVersionLabel,
}) {
  const feedbackControllerState = useAdminShellFeedbackController();
  const { browserActionsState } = feedbackControllerState;
  const {
    workspaceControllerState,
    editorControllerState,
    actionControllerState,
  } = useAdminShellCompositionController({
    authChecked,
    isAuthenticated,
    feedbackControllerState,
  });

  return useAdminAuthenticatedShellState({
    adminProtectionEnabled,
    handleLogout,
    adminVersionLabel,
    selectedSlug: workspaceControllerState.publicLinkState.selectedSlug,
    publicUrl: workspaceControllerState.publicLinkState.publicUrl,
    publicPath: workspaceControllerState.publicLinkState.publicPath,
    operationsFilter: workspaceControllerState.operationsFilter,
    setOperationsFilter: workspaceControllerState.setOperationsFilter,
    operationsSort: workspaceControllerState.operationsSort,
    setOperationsSort: workspaceControllerState.setOperationsSort,
    contentSectionState: editorControllerState.contentSectionState,
    browserActionsState,
    catalogState: workspaceControllerState.catalogState,
    detailState: workspaceControllerState.detailState,
    identityEditorState: editorControllerState.identityEditorState,
    selectionState: workspaceControllerState.selectionState,
    workspaceViewState: workspaceControllerState.workspaceViewState,
    commerceEditorState: editorControllerState.commerceEditorState,
    managedContentStoreState: workspaceControllerState.managedContentStoreState,
    managedContentState: editorControllerState.managedContentState,
    pipelineActionsState: actionControllerState.pipelineActionsState,
    qrWorkflowState: actionControllerState.qrWorkflowState,
    dangerZoneState: actionControllerState.dangerZoneState,
    clearStageActionWarning: actionControllerState.clearStageActionWarning,
  });
}
