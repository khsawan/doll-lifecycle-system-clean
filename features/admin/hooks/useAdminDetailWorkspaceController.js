"use client";

import { useAdminDetailDataController } from "./useAdminDetailDataController";
import { useAdminPublicLinkController } from "./useAdminPublicLinkController";

export function useAdminDetailWorkspaceController({
  authChecked,
  isAuthenticated,
  catalogWorkspaceState,
  setError,
}) {
  const detailDataControllerState = useAdminDetailDataController({
    authChecked,
    isAuthenticated,
    catalogWorkspaceState,
    setError,
  });
  const publicLinkControllerState = useAdminPublicLinkController({
    catalogWorkspaceState,
    detailDataControllerState,
  });

  return {
    ...detailDataControllerState,
    ...publicLinkControllerState,
  };
}
