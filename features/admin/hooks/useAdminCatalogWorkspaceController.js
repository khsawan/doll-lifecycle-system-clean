"use client";

import { useAdminCatalogDataController } from "./useAdminCatalogDataController";
import { useAdminWorkspaceFilterSelectionController } from "./useAdminWorkspaceFilterSelectionController";

export function useAdminCatalogWorkspaceController({
  authChecked,
  isAuthenticated,
  setError,
  setNotice,
}) {
  const catalogDataControllerState = useAdminCatalogDataController({
    authChecked,
    isAuthenticated,
    setError,
    setNotice,
  });
  const workspaceFilterSelectionControllerState =
    useAdminWorkspaceFilterSelectionController({
      catalogDataControllerState,
    });

  return {
    ...catalogDataControllerState,
    ...workspaceFilterSelectionControllerState,
  };
}
