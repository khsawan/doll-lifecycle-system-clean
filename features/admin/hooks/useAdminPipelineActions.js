"use client";

import { useProductionPipelineOrchestrator } from "../../production-pipeline/hooks/useProductionPipelineOrchestrator";
import {
  buildPipelineStageBlockedMessage,
  getPipelineStageReadinessState,
  syncDollRecordPipelineState,
} from "../domain/workflow";
import { saveAdminPipelineStateViaApi } from "../services/pipelineApi";

function resolveAdminPipelineStageReadinessState(
  stage,
  selectedReadiness,
  gatewayReadinessState
) {
  return getPipelineStageReadinessState(stage, selectedReadiness, {
    gateway: gatewayReadinessState,
  });
}

export function useAdminPipelineActions({
  selected,
  selectedPipelineState,
  selectedReadiness,
  gatewayReadinessState,
  setDolls,
  setError,
  setNotice,
  fetcher = typeof fetch === "undefined" ? null : fetch,
}) {
  return useProductionPipelineOrchestrator({
    selected,
    pipelineState: selectedPipelineState,
    readinessState: selectedReadiness,
    gatewayReadinessState,
    setRecords: setDolls,
    syncRecord: syncDollRecordPipelineState,
    persistPipelineState:
      fetcher && typeof fetcher === "function"
        ? (dollId, pipelineState) => saveAdminPipelineStateViaApi(fetcher, dollId, pipelineState)
        : null,
    setError,
    setNotice,
    resolveStageReadinessState: resolveAdminPipelineStageReadinessState,
    buildBlockedMessage: buildPipelineStageBlockedMessage,
  });
}
