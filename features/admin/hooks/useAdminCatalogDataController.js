"use client";

import { useAdminCatalog } from "./useAdminCatalog";
import { useAdminManagedContentState } from "./useAdminManagedContentState";

export function useAdminCatalogDataController({
  authChecked,
  isAuthenticated,
  setError,
  setNotice,
}) {
  const catalogState = useAdminCatalog({
    isEnabled: authChecked && isAuthenticated,
    setError,
    setNotice,
  });
  const managedContentStoreState = useAdminManagedContentState({
    selected: catalogState.selected,
    setDolls: catalogState.setDolls,
    setError,
  });

  return {
    catalogState,
    managedContentStoreState,
  };
}
