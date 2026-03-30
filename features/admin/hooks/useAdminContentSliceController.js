"use client";

import { useAdminContentPackContentController } from "./useAdminContentPackContentController";
import { useAdminSocialContentController } from "./useAdminSocialContentController";
import { useAdminStoryContentController } from "./useAdminStoryContentController";

export function useAdminContentSliceController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { storyTone, setStoryTone, storyEditorState } =
    useAdminStoryContentController({
      workspaceControllerState,
      setError,
      setNotice,
    });
  const { contentPackEditorState } = useAdminContentPackContentController({
    workspaceControllerState,
    setError,
    setNotice,
  });
  const { identityEditorState } = useAdminSocialContentController({
    workspaceControllerState,
    setError,
    setNotice,
  });

  return {
    storyTone,
    setStoryTone,
    storyEditorState,
    contentPackEditorState,
    identityEditorState,
  };
}
