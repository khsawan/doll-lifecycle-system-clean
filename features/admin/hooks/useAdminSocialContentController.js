"use client";

import { useAdminIdentityEditor } from "./useAdminIdentityEditor";

export function useAdminSocialContentController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, detailState, publicLinkState } = workspaceControllerState;
  const identityEditorState = useAdminIdentityEditor({
    selected: catalogState.selected,
    identity: detailState.identity,
    universeRecord: detailState.universeRecord,
    slugLocked: publicLinkState.slugLocked,
    setIdentity: detailState.setIdentity,
    setDolls: catalogState.setDolls,
    setSavedSocialSnapshot: detailState.setSavedSocialSnapshot,
    setError,
    setNotice,
  });

  return {
    identityEditorState,
  };
}
