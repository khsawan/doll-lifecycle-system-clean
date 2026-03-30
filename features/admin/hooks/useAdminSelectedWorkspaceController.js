"use client";

import { useAdminCatalogWorkspaceController } from "./useAdminCatalogWorkspaceController";
import { useAdminDetailWorkspaceController } from "./useAdminDetailWorkspaceController";
import { useAdminWorkspaceViewController } from "./useAdminWorkspaceViewController";

export function useAdminSelectedWorkspaceController({
  authChecked,
  isAuthenticated,
  error,
  notice,
  setError,
  setNotice,
}) {
  const catalogWorkspaceState = useAdminCatalogWorkspaceController({
    authChecked,
    isAuthenticated,
    setError,
    setNotice,
  });
  const detailWorkspaceState = useAdminDetailWorkspaceController({
    authChecked,
    isAuthenticated,
    catalogWorkspaceState,
    setError,
  });
  const { workspaceViewState } = useAdminWorkspaceViewController({
    catalogWorkspaceState,
    detailWorkspaceState,
    error,
    notice,
  });

  return {
    ...catalogWorkspaceState,
    ...detailWorkspaceState,
    workspaceViewState,
  };
}
