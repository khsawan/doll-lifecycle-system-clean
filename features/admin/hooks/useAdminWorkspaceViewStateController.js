"use client";

import { useAdminWorkspaceView } from "./useAdminWorkspaceView";

export function useAdminWorkspaceViewStateController({
  workspaceViewInputControllerState,
}) {
  return {
    workspaceViewState: useAdminWorkspaceView(
      workspaceViewInputControllerState.workspaceViewInput
    ),
  };
}
