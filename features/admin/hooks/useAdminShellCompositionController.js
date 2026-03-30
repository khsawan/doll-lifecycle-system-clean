"use client";

import { useAdminEditorActionShellController } from "./useAdminEditorActionShellController";
import { useAdminWorkspaceShellController } from "./useAdminWorkspaceShellController";

export function useAdminShellCompositionController({
  authChecked,
  isAuthenticated,
  feedbackControllerState,
}) {
  const { workspaceControllerState } = useAdminWorkspaceShellController({
    authChecked,
    isAuthenticated,
    feedbackControllerState,
  });
  const { editorControllerState, actionControllerState } =
    useAdminEditorActionShellController({
      workspaceControllerState,
      feedbackControllerState,
    });

  return {
    workspaceControllerState,
    editorControllerState,
    actionControllerState,
  };
}
