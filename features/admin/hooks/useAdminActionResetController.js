"use client";

import { useAdminSelectionResets } from "./useAdminSelectionResets";

export function useAdminActionResetController({
  workspaceControllerState,
  editorControllerState,
  pipelineActionsState,
  qrWorkflowState,
  dangerZoneState,
}) {
  const { catalogState, detailState } = workspaceControllerState;
  const {
    storyEditorState,
    contentPackEditorState,
    identityEditorState,
    commerceEditorState,
    managedContentState,
  } = editorControllerState;

  useAdminSelectionResets({
    selectedId: catalogState.selectedId,
    setQrUploading: qrWorkflowState.setQrUploading,
    setShowQrRegenerateWarning: qrWorkflowState.setShowQrRegenerateWarning,
    setDangerAction: dangerZoneState.setDangerAction,
    setDangerConfirmText: dangerZoneState.setDangerConfirmText,
    setDangerLoading: dangerZoneState.setDangerLoading,
    setPlayActivity: detailState.setPlayActivity,
    setStoryVariations: storyEditorState.setStoryVariations,
    setSelectedStoryVariationId:
      storyEditorState.setSelectedStoryVariationId,
    setStorySaving: storyEditorState.setStorySaving,
    setContentPackGenerating: contentPackEditorState.setContentPackGenerating,
    setContentPackSaving: contentPackEditorState.setContentPackSaving,
    setContentPackVariations: contentPackEditorState.setContentPackVariations,
    setSelectedContentPackVariationId:
      contentPackEditorState.setSelectedContentPackVariationId,
    setSocialGenerating: identityEditorState.setSocialGenerating,
    setSocialSaving: identityEditorState.setSocialSaving,
    setSocialVariations: identityEditorState.setSocialVariations,
    setSelectedSocialVariationId:
      identityEditorState.setSelectedSocialVariationId,
    setCommerceSaving: commerceEditorState.setCommerceSaving,
    setPipelineStageCompleting: pipelineActionsState.setPipelineStageCompleting,
    setPipelineStageReopening: pipelineActionsState.setPipelineStageReopening,
    setStageActionWarning: pipelineActionsState.setStageActionWarning,
    setGeneratedContentEditState:
      managedContentState.setGeneratedContentEditState,
    setGeneratedContentSavingState:
      managedContentState.setGeneratedContentSavingState,
    setIntroScriptDraft: managedContentState.setIntroScriptDraft,
    setStoryPageDrafts: managedContentState.setStoryPageDrafts,
    setPlayActivityDraft: managedContentState.setPlayActivityDraft,
  });
}
