import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminActionController", () => ({
  useAdminActionController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminEditorController", () => ({
  useAdminEditorController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminSelectedWorkspaceController", () => ({
  useAdminSelectedWorkspaceController: vi.fn(),
}));

import { useAdminActionController } from "../../../../features/admin/hooks/useAdminActionController";
import { useAdminEditorActionShellController } from "../../../../features/admin/hooks/useAdminEditorActionShellController";
import { useAdminEditorController } from "../../../../features/admin/hooks/useAdminEditorController";
import { useAdminSelectedWorkspaceController } from "../../../../features/admin/hooks/useAdminSelectedWorkspaceController";
import { useAdminWorkspaceShellController } from "../../../../features/admin/hooks/useAdminWorkspaceShellController";

function WorkspaceHookProbe({ onValue, feedbackControllerState }) {
  onValue(
    useAdminWorkspaceShellController({
      authChecked: true,
      isAuthenticated: true,
      feedbackControllerState,
    })
  );

  return createElement("div", null, "probe");
}

function EditorActionHookProbe({
  onValue,
  feedbackControllerState,
  workspaceControllerState,
}) {
  onValue(
    useAdminEditorActionShellController({
      workspaceControllerState,
      feedbackControllerState,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin shell composition slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the workspace shell controller", () => {
    const feedbackControllerState = {
      error: "Existing error",
      notice: "Saved",
      setError: vi.fn(),
      setNotice: vi.fn(),
    };
    const workspaceControllerState = {
      catalogState: { selected: { id: "doll-1" } },
    };

    useAdminSelectedWorkspaceController.mockReturnValue(workspaceControllerState);

    let result;
    renderToStaticMarkup(
      createElement(WorkspaceHookProbe, {
        onValue: (value) => {
          result = value;
        },
        feedbackControllerState,
      })
    );

    expect(useAdminSelectedWorkspaceController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: true,
      error: "Existing error",
      notice: "Saved",
      setError: feedbackControllerState.setError,
      setNotice: feedbackControllerState.setNotice,
    });
    expect(result).toEqual({
      workspaceControllerState,
    });
  });

  it("wires the editor/action shell controller", () => {
    const feedbackControllerState = {
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

    useAdminEditorController.mockReturnValue(editorControllerState);
    useAdminActionController.mockReturnValue(actionControllerState);

    let result;
    renderToStaticMarkup(
      createElement(EditorActionHookProbe, {
        onValue: (value) => {
          result = value;
        },
        feedbackControllerState,
        workspaceControllerState,
      })
    );

    expect(useAdminEditorController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError: feedbackControllerState.setError,
      setNotice: feedbackControllerState.setNotice,
    });
    expect(useAdminActionController).toHaveBeenCalledWith({
      workspaceControllerState,
      editorControllerState,
      setError: feedbackControllerState.setError,
      setNotice: feedbackControllerState.setNotice,
    });
    expect(result).toEqual({
      editorControllerState,
      actionControllerState,
    });
  });
});
