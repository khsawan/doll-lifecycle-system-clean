"use client";

import { useState } from "react";
import { useAdminStoryEditor } from "./useAdminStoryEditor";

export function useAdminStoryContentController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const { catalogState, detailState } = workspaceControllerState;
  const [storyTone, setStoryTone] = useState("Gentle");
  const storyEditorState = useAdminStoryEditor({
    selected: catalogState.selected,
    identity: detailState.identity,
    story: detailState.story,
    setStoryTone,
    setStory: detailState.setStory,
    setDolls: catalogState.setDolls,
    setSavedStorySnapshot: detailState.setSavedStorySnapshot,
    setError,
    setNotice,
  });

  return {
    storyTone,
    setStoryTone,
    storyEditorState,
  };
}
