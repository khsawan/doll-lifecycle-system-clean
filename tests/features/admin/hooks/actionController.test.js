import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminDangerActionController", () => ({
  useAdminDangerActionController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminActionResetController", () => ({
  useAdminActionResetController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminPipelineActionController", () => ({
  useAdminPipelineActionController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminQrActionController", () => ({
  useAdminQrActionController: vi.fn(),
}));

import { useAdminActionController } from "../../../../features/admin/hooks/useAdminActionController";
import { useAdminActionResetController } from "../../../../features/admin/hooks/useAdminActionResetController";
import { useAdminDangerActionController } from "../../../../features/admin/hooks/useAdminDangerActionController";
import { useAdminPipelineActionController } from "../../../../features/admin/hooks/useAdminPipelineActionController";
import { useAdminQrActionController } from "../../../../features/admin/hooks/useAdminQrActionController";

function HookProbe({ onValue, workspaceControllerState, editorControllerState }) {
  onValue(
    useAdminActionController({
      workspaceControllerState,
      editorControllerState,
      setError: () => {},
      setNotice: () => {},
    })
  );

  return createElement("div", null, "probe");
}

describe("admin action controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the pipeline, QR, danger, and reset controllers", () => {
    const pipelineActionsState = {
      setPipelineStageCompleting: vi.fn(),
      setPipelineStageReopening: vi.fn(),
      setStageActionWarning: vi.fn(),
    };
    const qrWorkflowState = {
      setQrUploading: vi.fn(),
      setShowQrRegenerateWarning: vi.fn(),
      printCardRef: { current: null },
    };
    const dangerZoneState = {
      setDangerAction: vi.fn(),
      setDangerConfirmText: vi.fn(),
      setDangerLoading: vi.fn(),
    };
    const clearStageActionWarning = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selectedId: "doll-1",
      },
      detailState: {
        setQrDataUrl: vi.fn(),
        setStory: vi.fn(),
        setContentPack: vi.fn(),
        setOrder: vi.fn(),
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

    useAdminPipelineActionController.mockReturnValue({
      pipelineActionsState,
      clearStageActionWarning,
    });
    useAdminQrActionController.mockReturnValue({
      qrWorkflowState,
    });
    useAdminDangerActionController.mockReturnValue({
      dangerZoneState,
    });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        editorControllerState,
      })
    );

    expect(useAdminPipelineActionController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError: expect.any(Function),
      setNotice: expect.any(Function),
    });
    expect(useAdminQrActionController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError: expect.any(Function),
      setNotice: expect.any(Function),
    });
    expect(useAdminDangerActionController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError: expect.any(Function),
      setNotice: expect.any(Function),
    });
    expect(useAdminActionResetController).toHaveBeenCalledWith({
      workspaceControllerState,
      editorControllerState,
      pipelineActionsState,
      qrWorkflowState,
      dangerZoneState,
    });
    expect(result).toEqual({
      pipelineActionsState,
      qrWorkflowState,
      dangerZoneState,
      clearStageActionWarning,
    });
  });
});
