import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminAuthenticatedShellState", () => ({
  useAdminAuthenticatedShellState: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminShellCompositionController", () => ({
  useAdminShellCompositionController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminShellFeedbackController", () => ({
  useAdminShellFeedbackController: vi.fn(),
}));

import { useAdminAuthenticatedShellController } from "../../../../features/admin/hooks/useAdminAuthenticatedShellController";
import { useAdminAuthenticatedShellState } from "../../../../features/admin/hooks/useAdminAuthenticatedShellState";
import { useAdminShellCompositionController } from "../../../../features/admin/hooks/useAdminShellCompositionController";
import { useAdminShellFeedbackController } from "../../../../features/admin/hooks/useAdminShellFeedbackController";

function HookProbe({ onValue, handleLogout }) {
  onValue(
    useAdminAuthenticatedShellController({
      authChecked: true,
      adminProtectionEnabled: true,
      isAuthenticated: true,
      handleLogout,
      adminVersionLabel: "build-123",
    })
  );

  return createElement("div", null, "probe");
}

describe("authenticated shell controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes feedback state and grouped controllers into shell state", () => {
    const browserActionsState = {
      copyToClipboard: vi.fn(),
      openPublicPage: vi.fn(),
    };
    const workspaceControllerState = {
      catalogState: { dolls: [], selected: { id: "doll-1" } },
      detailState: { identity: { name: "Rosie" } },
      managedContentStoreState: { selectedContentManagement: {} },
      selectionState: { openDollWorkspace: vi.fn() },
      publicLinkState: {
        selectedSlug: "rosie",
        publicUrl: "https://example.com/doll/rosie",
        publicPath: "/doll/rosie",
      },
      workspaceViewState: { selectedReadiness: { overall: true } },
      operationsFilter: "needs_attention",
      setOperationsFilter: vi.fn(),
      operationsSort: "urgency",
      setOperationsSort: vi.fn(),
    };
    const editorControllerState = {
      contentSectionState: { storySaveState: { label: "Saved" } },
      identityEditorState: { saveIdentity: vi.fn() },
      commerceEditorState: { saveOrder: vi.fn() },
      managedContentState: { generateDraft: vi.fn() },
    };
    const actionControllerState = {
      pipelineActionsState: { stageActionWarning: null },
      qrWorkflowState: { printCardRef: { current: null } },
      dangerZoneState: { dangerAction: null },
      clearStageActionWarning: vi.fn(),
    };
    const feedbackControllerState = {
      notice: "",
      setNotice: vi.fn(),
      error: "",
      setError: vi.fn(),
      browserActionsState,
    };

    useAdminShellFeedbackController.mockReturnValue(feedbackControllerState);
    useAdminShellCompositionController.mockReturnValue({
      workspaceControllerState,
      editorControllerState,
      actionControllerState,
    });
    useAdminAuthenticatedShellState.mockReturnValue({ shell: true });

    let result;
    const handleLogout = vi.fn();
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        handleLogout,
      })
    );

    expect(useAdminShellFeedbackController).toHaveBeenCalledWith();
    expect(useAdminShellCompositionController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: true,
      feedbackControllerState,
    });
    expect(useAdminAuthenticatedShellState).toHaveBeenCalledWith({
      adminProtectionEnabled: true,
      handleLogout,
      adminVersionLabel: "build-123",
      selectedSlug: "rosie",
      publicUrl: "https://example.com/doll/rosie",
      publicPath: "/doll/rosie",
      operationsFilter: "needs_attention",
      setOperationsFilter: workspaceControllerState.setOperationsFilter,
      operationsSort: "urgency",
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
    expect(result).toEqual({ shell: true });
  });
});
