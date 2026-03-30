"use client";

import { useAdminPublicLinkState } from "./useAdminPublicLinkState";

export function useAdminPublicLinkController({
  catalogWorkspaceState,
  detailDataControllerState,
}) {
  const { catalogState } = catalogWorkspaceState;
  const { detailState } = detailDataControllerState;

  return {
    publicLinkState: useAdminPublicLinkState({
      selected: catalogState.selected,
      identity: detailState.identity,
    }),
  };
}
