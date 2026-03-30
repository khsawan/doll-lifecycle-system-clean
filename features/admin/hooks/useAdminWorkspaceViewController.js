"use client";

import { useAdminWorkspaceViewInputController } from "./useAdminWorkspaceViewInputController";
import { useAdminWorkspaceViewStateController } from "./useAdminWorkspaceViewStateController";

export function useAdminWorkspaceViewController({
  catalogWorkspaceState,
  detailWorkspaceState,
  error,
  notice,
}) {
  const workspaceViewInputControllerState = useAdminWorkspaceViewInputController({
    catalogWorkspaceState,
    detailWorkspaceState,
    error,
    notice,
  });

  return useAdminWorkspaceViewStateController({
    workspaceViewInputControllerState,
  });
}
