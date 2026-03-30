import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminSelectionResets", () => ({
  useAdminSelectionResets: vi.fn(),
}));

import { useAdminActionResetController } from "../../../../features/admin/hooks/useAdminActionResetController";
import { useAdminSelectionResets } from "../../../../features/admin/hooks/useAdminSelectionResets";

function HookProbe({
  workspaceControllerState,
  editorControllerState,
  pipelineActionsState,
  qrWorkflowState,
  dangerZoneState,
}) {
  useAdminActionResetController({
    workspaceControllerState,
    editorControllerState,
    pipelineActionsState,
    qrWorkflowState,
    dangerZoneState,
  });

  return createElement("div", null, "probe");
}

describe("admin action reset controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps grouped controller state into the selection reset hook payload", () => {
    const workspaceControllerState = {
      catalogState: {
        selectedId: "doll-1",
      },
      detailState: {
        setPlayActivity: vi.fn(),
      },
    };
    const editorControllerState = {
      storyEditorState: {
        setStoryVariations: vi.fn(),
        setSelectedStoryVariationId: vi.fn(),
        setStorySaving: vi.fn(),
      },
      contentPackEditorState: {
        setContentPackGenerating: vi.fn(),
        setContentPackSaving: vi.fn(),
        setContentPackVariations: vi.fn(),
        setSelectedContentPackVariationId: vi.fn(),
      },
      identityEditorState: {
        setSocialGenerating: vi.fn(),
        setSocialSaving: vi.fn(),
        setSocialVariations: vi.fn(),
        setSelectedSocialVariationId: vi.fn(),
      },
      commerceEditorState: {
        setCommerceSaving: vi.fn(),
      },
      managedContentState: {
        setGeneratedContentEditState: vi.fn(),
        setGeneratedContentSavingState: vi.fn(),
        setIntroScriptDraft: vi.fn(),
        setStoryPageDrafts: vi.fn(),
        setPlayActivityDraft: vi.fn(),
      },
    };
    const pipelineActionsState = {
      setPipelineStageCompleting: vi.fn(),
      setPipelineStageReopening: vi.fn(),
      setStageActionWarning: vi.fn(),
    };
    const qrWorkflowState = {
      setQrUploading: vi.fn(),
      setShowQrRegenerateWarning: vi.fn(),
    };
    const dangerZoneState = {
      setDangerAction: vi.fn(),
      setDangerConfirmText: vi.fn(),
      setDangerLoading: vi.fn(),
    };

    renderToStaticMarkup(
      createElement(HookProbe, {
        workspaceControllerState,
        editorControllerState,
        pipelineActionsState,
        qrWorkflowState,
        dangerZoneState,
      })
    );

    expect(useAdminSelectionResets).toHaveBeenCalledWith({
      selectedId: "doll-1",
      setQrUploading: qrWorkflowState.setQrUploading,
      setShowQrRegenerateWarning: qrWorkflowState.setShowQrRegenerateWarning,
      setDangerAction: dangerZoneState.setDangerAction,
      setDangerConfirmText: dangerZoneState.setDangerConfirmText,
      setDangerLoading: dangerZoneState.setDangerLoading,
      setPlayActivity: workspaceControllerState.detailState.setPlayActivity,
      setStoryVariations: editorControllerState.storyEditorState.setStoryVariations,
      setSelectedStoryVariationId:
        editorControllerState.storyEditorState.setSelectedStoryVariationId,
      setStorySaving: editorControllerState.storyEditorState.setStorySaving,
      setContentPackGenerating:
        editorControllerState.contentPackEditorState.setContentPackGenerating,
      setContentPackSaving:
        editorControllerState.contentPackEditorState.setContentPackSaving,
      setContentPackVariations:
        editorControllerState.contentPackEditorState.setContentPackVariations,
      setSelectedContentPackVariationId:
        editorControllerState.contentPackEditorState
          .setSelectedContentPackVariationId,
      setSocialGenerating:
        editorControllerState.identityEditorState.setSocialGenerating,
      setSocialSaving: editorControllerState.identityEditorState.setSocialSaving,
      setSocialVariations:
        editorControllerState.identityEditorState.setSocialVariations,
      setSelectedSocialVariationId:
        editorControllerState.identityEditorState.setSelectedSocialVariationId,
      setCommerceSaving: editorControllerState.commerceEditorState.setCommerceSaving,
      setPipelineStageCompleting: pipelineActionsState.setPipelineStageCompleting,
      setPipelineStageReopening: pipelineActionsState.setPipelineStageReopening,
      setStageActionWarning: pipelineActionsState.setStageActionWarning,
      setGeneratedContentEditState:
        editorControllerState.managedContentState.setGeneratedContentEditState,
      setGeneratedContentSavingState:
        editorControllerState.managedContentState.setGeneratedContentSavingState,
      setIntroScriptDraft:
        editorControllerState.managedContentState.setIntroScriptDraft,
      setStoryPageDrafts:
        editorControllerState.managedContentState.setStoryPageDrafts,
      setPlayActivityDraft:
        editorControllerState.managedContentState.setPlayActivityDraft,
    });
  });
});
