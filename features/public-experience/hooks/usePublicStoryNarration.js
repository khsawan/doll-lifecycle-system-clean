"use client";

import { useEffect, useRef } from "react";
import { shouldAutoplayStoryNarration } from "../domain/audio";

export default function usePublicStoryNarration({
  ambientAudioRef,
  storyAudioRef,
  isStoryScene = false,
  isContinuousStoryNarrationEnabled = false,
  isStoryPlaybackSessionActive = false,
  setIsStoryPlaybackSessionActive,
  storyAudioSrc = "",
  storyPageIndex = 0,
}) {
  const previousStoryPageIndexRef = useRef(0);

  useEffect(() => {
    const previousStoryPageIndex = previousStoryPageIndexRef.current;
    previousStoryPageIndexRef.current = storyPageIndex;

    if (
      !shouldAutoplayStoryNarration({
        hasStoryAudioRef: Boolean(storyAudioRef.current),
        isStoryScene,
        isContinuousStoryNarrationEnabled,
        isStoryPlaybackSessionActive,
        storyAudioSrc,
        storyPageIndex,
        previousStoryPageIndex,
      })
    ) {
      return;
    }

    let isCancelled = false;

    async function autoplayStoryNarration() {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }

      try {
        await storyAudioRef.current.play();
      } catch {
        if (!isCancelled) {
          setIsStoryPlaybackSessionActive(false);
        }
      }
    }

    void autoplayStoryNarration();

    return () => {
      isCancelled = true;
    };
  }, [
    ambientAudioRef,
    isContinuousStoryNarrationEnabled,
    isStoryPlaybackSessionActive,
    isStoryScene,
    setIsStoryPlaybackSessionActive,
    storyAudioRef,
    storyAudioSrc,
    storyPageIndex,
  ]);
}
