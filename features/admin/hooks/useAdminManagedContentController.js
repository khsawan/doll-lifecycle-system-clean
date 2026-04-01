"use client";

import { useAdminManagedContent } from "./useAdminManagedContent";

export function useAdminManagedContentController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const {
    catalogState,
    detailState,
    managedContentStoreState,
    workspaceViewState,
  } = workspaceControllerState;

  return {
    managedContentState: useAdminManagedContent({
      selected: catalogState.selected,
      identity: detailState.identity,
      universeRecord: detailState.universeRecord,
      selectedContentManagement:
        managedContentStoreState.selectedContentManagement,
      selectedGeneratedV1Content:
        managedContentStoreState.selectedGeneratedV1Content,
      contentPreviewHref: workspaceViewState.contentPreviewHref,
      updateSelectedContentManagement:
        managedContentStoreState.updateSelectedContentManagement,
      setGeneratedV1ContentByDoll:
        managedContentStoreState.setGeneratedV1ContentByDoll,
      setIdentity: detailState.setIdentity,
      setStory: detailState.setStory,
      setPlayActivity: detailState.setPlayActivity,
      setDolls: catalogState.setDolls,
      setError,
      setNotice,
    }),
  };
}
