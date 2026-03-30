import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminEditorActionShellController", () => ({
  useAdminEditorActionShellController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminWorkspaceShellController", () => ({
  useAdminWorkspaceShellController: vi.fn(),
}));

import { useAdminEditorActionShellController } from "../../../../features/admin/hooks/useAdminEditorActionShellController";
import { useAdminShellCompositionController } from "../../../../features/admin/hooks/useAdminShellCompositionController";
import { useAdminWorkspaceShellController } from "../../../../features/admin/hooks/useAdminWorkspaceShellController";

function HookProbe({ onValue, feedbackControllerState }) {
  onValue(
    useAdminShellCompositionController({
      authChecked: true,
      isAuthenticated: true,
      feedbackControllerState,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin shell composition controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the workspace seam and editor/action seam", () => {
    const feedbackControllerState = {
      error: "",
      notice: "",
      setError: vi.fn(),
      setNotice: vi.fn(),
    };
    const workspaceControllerState = {
      catalogState: { selected: { id: "doll-1" } },
    };
    const editorControllerState = {
      contentSectionState: { storySaveState: { label: "Saved" } },
    };
    const actionControllerState = {
      pipelineActionsState: { stageActionWarning: null },
    };

    useAdminWorkspaceShellController.mockReturnValue({
      workspaceControllerState,
    });
    useAdminEditorActionShellController.mockReturnValue({
      editorControllerState,
      actionControllerState,
    });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        feedbackControllerState,
      })
    );

    expect(useAdminWorkspaceShellController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: true,
      feedbackControllerState,
    });
    expect(useAdminEditorActionShellController).toHaveBeenCalledWith({
      workspaceControllerState,
      feedbackControllerState,
    });
    expect(result).toEqual({
      workspaceControllerState,
      editorControllerState,
      actionControllerState,
    });
  });
});
