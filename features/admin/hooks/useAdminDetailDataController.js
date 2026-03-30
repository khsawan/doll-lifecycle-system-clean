"use client";

import { useAdminDetailState } from "./useAdminDetailState";

export function useAdminDetailDataController({
  authChecked,
  isAuthenticated,
  catalogWorkspaceState,
  setError,
}) {
  const { catalogState, managedContentStoreState } = catalogWorkspaceState;

  return {
    detailState: useAdminDetailState({
      isEnabled: authChecked && isAuthenticated,
      selected: catalogState.selected,
      dolls: catalogState.dolls,
      generatedV1ContentByDoll: managedContentStoreState.generatedV1ContentByDoll,
      setError,
    }),
  };
}
