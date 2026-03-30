"use client";

import { useAdminActionController } from "./useAdminActionController";
import { useAdminEditorController } from "./useAdminEditorController";

export function useAdminEditorActionShellController({
  workspaceControllerState,
  feedbackControllerState,
}) {
  const { setError, setNotice } = feedbackControllerState;
  const editorControllerState = useAdminEditorController({
    workspaceControllerState,
    setError,
    setNotice,
  });
  const actionControllerState = useAdminActionController({
    workspaceControllerState,
    editorControllerState,
    setError,
    setNotice,
  });

  return {
    editorControllerState,
    actionControllerState,
  };
}
