"use client";

import { useAdminContentSectionController } from "./useAdminContentSectionController";
import { useAdminContentSliceController } from "./useAdminContentSliceController";

export function useAdminContentEditorController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const contentSliceControllerState = useAdminContentSliceController({
    workspaceControllerState,
    setError,
    setNotice,
  });
  const contentSectionControllerState = useAdminContentSectionController({
    workspaceControllerState,
    contentSliceControllerState,
  });

  return {
    storyEditorState: contentSliceControllerState.storyEditorState,
    contentPackEditorState: contentSliceControllerState.contentPackEditorState,
    identityEditorState: contentSliceControllerState.identityEditorState,
    ...contentSectionControllerState,
  };
}
