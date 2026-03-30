"use client";

export function useAdminWorkspaceViewInputController({
  catalogWorkspaceState,
  detailWorkspaceState,
  error,
  notice,
}) {
  const {
    catalogState,
    managedContentStoreState,
    selectionState,
    operationsFilter,
    operationsSort,
  } = catalogWorkspaceState;
  const { detailState, publicLinkState } = detailWorkspaceState;

  return {
    workspaceViewInput: {
      selected: catalogState.selected,
      identity: detailState.identity,
      story: detailState.story,
      contentPack: detailState.contentPack,
      order: detailState.order,
      qrDataUrl: detailState.qrDataUrl,
      dolls: catalogState.dolls,
      contentManagementByDoll: managedContentStoreState.contentManagementByDoll,
      selectedContentManagement: managedContentStoreState.selectedContentManagement,
      selectedGeneratedV1Content: managedContentStoreState.selectedGeneratedV1Content,
      activeDepartment: selectionState.activeDepartment,
      activeStageView: selectionState.activeStageView,
      selectedWorkspaceMode: selectionState.selectedWorkspaceMode,
      operationsFilter,
      operationsSort,
      selectedSlug: publicLinkState.selectedSlug,
      publicPath: publicLinkState.publicPath,
      publicUrl: publicLinkState.publicUrl,
      savedSlug: publicLinkState.savedSlug,
      legacyLockedSlug: publicLinkState.legacyLockedSlug,
      error,
      notice,
    },
  };
}
