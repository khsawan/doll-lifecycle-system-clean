"use client";

import { useAdminCommerceEditor } from "./useAdminCommerceEditor";

export function useAdminCommerceEditorController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, detailState, workspaceViewState } = workspaceControllerState;

  return {
    commerceEditorState: useAdminCommerceEditor({
      selected: catalogState.selected,
      selectedReadiness: workspaceViewState.selectedReadiness,
      effectiveSalesStatus: workspaceViewState.effectiveSalesStatus,
      commerceStatus: detailState.commerceStatus,
      order: detailState.order,
      saleTransitionReadinessMessage:
        workspaceViewState.saleTransitionReadinessMessage,
      setCommerceStatus: detailState.setCommerceStatus,
      setDolls: catalogState.setDolls,
      setError,
      setNotice,
    }),
  };
}
