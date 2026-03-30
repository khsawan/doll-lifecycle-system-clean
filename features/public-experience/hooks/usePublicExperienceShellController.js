"use client";

import { useRef } from "react";
import { usePublicExperienceAudioController } from "./usePublicExperienceAudioController";
import { usePublicExperienceSceneController } from "./usePublicExperienceSceneController";

export function usePublicExperienceShellController({
  experience,
  transitionMs = 300,
}) {
  const onBeforeSceneChangeRef = useRef(null);
  const sceneControllerState = usePublicExperienceSceneController({
    experience,
    transitionMs,
    onBeforeSceneChange: () => {
      onBeforeSceneChangeRef.current?.();
    },
  });
  const audioControllerState = usePublicExperienceAudioController({
    experience,
    enabledScenes: sceneControllerState.enabledScenes,
    sceneIndex: sceneControllerState.sceneIndex,
    currentScenePreview: sceneControllerState.currentScenePreview,
  });

  onBeforeSceneChangeRef.current = audioControllerState.handleSceneChangeStart;

  return {
    transitionMs,
    ...sceneControllerState,
    ...audioControllerState,
  };
}
