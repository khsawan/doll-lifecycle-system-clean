"use client";

import { useAdminDangerZone } from "./useAdminDangerZone";

export function useAdminDangerActionController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, detailState, workspaceViewState } = workspaceControllerState;
  const dangerZoneState = useAdminDangerZone({
    selected: catalogState.selected,
    dolls: catalogState.dolls,
    dangerNeedsArchiveWarning: workspaceViewState.dangerNeedsArchiveWarning,
    dangerNeedsTypedDelete: workspaceViewState.dangerNeedsTypedDelete,
    setDolls: catalogState.setDolls,
    setSelectedId: catalogState.setSelectedId,
    setQrDataUrl: detailState.setQrDataUrl,
    setStory: detailState.setStory,
    setContentPack: detailState.setContentPack,
    setOrder: detailState.setOrder,
    setError,
    setNotice,
  });

  return {
    dangerZoneState,
  };
}
