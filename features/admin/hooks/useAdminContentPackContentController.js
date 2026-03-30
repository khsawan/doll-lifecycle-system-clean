"use client";

import { useAdminContentPackEditor } from "./useAdminContentPackEditor";

export function useAdminContentPackContentController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, detailState } = workspaceControllerState;
  const contentPackEditorState = useAdminContentPackEditor({
    selected: catalogState.selected,
    identity: detailState.identity,
    contentPack: detailState.contentPack,
    setContentPack: detailState.setContentPack,
    setDolls: catalogState.setDolls,
    setSavedContentPackSnapshot: detailState.setSavedContentPackSnapshot,
    setError,
    setNotice,
  });

  return {
    contentPackEditorState,
  };
}
