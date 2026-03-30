"use client";

import { useMemo } from "react";
import {
  resolveAmbientTheme,
  selectEnabledScenes,
} from "../domain/runtime";
import usePublicSceneNavigation from "./usePublicSceneNavigation";

export function usePublicExperienceSceneController({
  experience,
  onBeforeSceneChange,
  transitionMs = 300,
}) {
  const enabledScenes = useMemo(() => selectEnabledScenes(experience), [experience]);
  const ambientTheme = useMemo(
    () => resolveAmbientTheme(experience?.universe?.name),
    [experience?.universe?.name]
  );
  const navigationState = usePublicSceneNavigation({
    enabledSceneCount: enabledScenes.length,
    transitionMs,
    onBeforeSceneChange,
  });
  const currentScenePreview = enabledScenes[navigationState.sceneIndex] || null;

  return {
    enabledScenes,
    ambientTheme,
    currentScenePreview,
    ...navigationState,
  };
}
