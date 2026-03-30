"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canRequestSceneChange,
  clampSceneIndex,
} from "../domain/navigation";

export default function usePublicSceneNavigation({
  enabledSceneCount = 0,
  transitionMs = 300,
  onBeforeSceneChange,
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isSceneVisible, setIsSceneVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeOutTimeoutRef = useRef(null);
  const fadeInTimeoutRef = useRef(null);
  const onBeforeSceneChangeRef = useRef(onBeforeSceneChange);

  useEffect(() => {
    onBeforeSceneChangeRef.current = onBeforeSceneChange;
  }, [onBeforeSceneChange]);

  const clearSceneTransitionTimeouts = useCallback(() => {
    if (fadeOutTimeoutRef.current) {
      window.clearTimeout(fadeOutTimeoutRef.current);
      fadeOutTimeoutRef.current = null;
    }

    if (fadeInTimeoutRef.current) {
      window.clearTimeout(fadeInTimeoutRef.current);
      fadeInTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setSceneIndex((currentIndex) => clampSceneIndex(currentIndex, enabledSceneCount));
  }, [enabledSceneCount]);

  useEffect(() => clearSceneTransitionTimeouts, [clearSceneTransitionTimeouts]);

  const startSceneTransition = useCallback(
    (nextIndex) => {
      setIsSceneVisible(false);

      fadeOutTimeoutRef.current = window.setTimeout(() => {
        setSceneIndex(nextIndex);
        window.requestAnimationFrame(() => {
          setIsSceneVisible(true);
        });

        fadeInTimeoutRef.current = window.setTimeout(() => {
          setIsTransitioning(false);
        }, transitionMs);
      }, transitionMs);
    },
    [transitionMs]
  );

  const requestSceneChange = useCallback(
    (nextIndex) => {
      if (
        !canRequestSceneChange({
          isTransitioning,
          nextIndex,
          sceneCount: enabledSceneCount,
          sceneIndex,
        })
      ) {
        return;
      }

      clearSceneTransitionTimeouts();
      setIsTransitioning(true);
      onBeforeSceneChangeRef.current?.();
      startSceneTransition(nextIndex);
    },
    [
      clearSceneTransitionTimeouts,
      enabledSceneCount,
      isTransitioning,
      sceneIndex,
      startSceneTransition,
    ]
  );

  const goPrevious = useCallback(() => {
    requestSceneChange(sceneIndex - 1);
  }, [requestSceneChange, sceneIndex]);

  const goNext = useCallback(() => {
    requestSceneChange(sceneIndex + 1);
  }, [requestSceneChange, sceneIndex]);

  return {
    sceneIndex,
    isSceneVisible,
    isTransitioning,
    requestSceneChange,
    goPrevious,
    goNext,
  };
}
