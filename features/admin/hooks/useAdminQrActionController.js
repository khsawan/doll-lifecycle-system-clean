"use client";

import { useRef } from "react";
import { useAdminQrWorkflow } from "./useAdminQrWorkflow";

export function useAdminQrActionController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, detailState, publicLinkState, workspaceViewState } =
    workspaceControllerState;
  const printCardRef = useRef(null);

  return {
    qrWorkflowState: {
      ...useAdminQrWorkflow({
        selected: catalogState.selected,
        slugLocked: publicLinkState.slugLocked,
        selectedSlug: publicLinkState.selectedSlug,
        publicUrl: publicLinkState.publicUrl,
        qrReady: workspaceViewState.qrReady,
        qrReadinessMessage: workspaceViewState.qrReadinessMessage,
        qrDataUrl: detailState.qrDataUrl,
        setQrDataUrl: detailState.setQrDataUrl,
        savedQrUrl: workspaceViewState.savedQrUrl,
        qrIsSensitive: workspaceViewState.qrIsSensitive,
        printCardRef,
        setDolls: catalogState.setDolls,
        setError,
        setNotice,
      }),
      printCardRef,
    },
  };
}
