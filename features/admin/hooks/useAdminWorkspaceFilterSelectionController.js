"use client";

import { useState } from "react";
import { useAdminWorkspaceSelection } from "./useAdminWorkspaceSelection";

export function useAdminWorkspaceFilterSelectionController({
  catalogDataControllerState,
}) {
  const { catalogState } = catalogDataControllerState;
  const [operationsFilter, setOperationsFilter] = useState("all");
  const [operationsSort, setOperationsSort] = useState("urgency");
  const selectionState = useAdminWorkspaceSelection({
    currentSelectedId: catalogState.selected?.id || null,
    setSelectedId: catalogState.setSelectedId,
  });

  return {
    selectionState,
    operationsFilter,
    setOperationsFilter,
    operationsSort,
    setOperationsSort,
  };
}
