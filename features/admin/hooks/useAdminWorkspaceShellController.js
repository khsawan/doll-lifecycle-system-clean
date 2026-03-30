"use client";

import { useAdminSelectedWorkspaceController } from "./useAdminSelectedWorkspaceController";

export function useAdminWorkspaceShellController({
  authChecked,
  isAuthenticated,
  feedbackControllerState,
}) {
  const { error, notice, setError, setNotice } = feedbackControllerState;

  return {
    workspaceControllerState: useAdminSelectedWorkspaceController({
      authChecked,
      isAuthenticated,
      error,
      notice,
      setError,
      setNotice,
    }),
  };
}
