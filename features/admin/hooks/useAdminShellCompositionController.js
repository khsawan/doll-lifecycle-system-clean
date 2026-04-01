"use client";

import { useState } from "react";
import { useAdminEditorActionShellController } from "./useAdminEditorActionShellController";
import { useAdminWorkspaceShellController } from "./useAdminWorkspaceShellController";

export function useAdminShellCompositionController({
  authChecked,
  isAuthenticated,
  feedbackControllerState,
}) {
  const [activeTopNav, setActiveTopNav] = useState("dolls");

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
    activeTopNav,
    setActiveTopNav,
  };
}
