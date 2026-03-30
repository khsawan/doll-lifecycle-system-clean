"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildExperienceShellState,
  resolveExperienceAudio,
} from "../domain/runtime";
import usePublicAmbientAudio from "./usePublicAmbientAudio";
import usePublicAudioTrack from "./usePublicAudioTrack";
import usePublicStoryNarration from "./usePublicStoryNarration";

function pauseAudio(audioRef) {
  if (audioRef.current) {
    audioRef.current.pause();
  }
}

function pauseAndResetAudio(audioRef) {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
}

export function usePublicExperienceAudioController({
  experience,
  enabledScenes,
  sceneIndex,
  currentScenePreview,
}) {
  const [isAmbientAudioEnabled, setIsAmbientAudioEnabled] = useState(false);
  const [storyPageIndex, setStoryPageIndex] = useState(0);
  const [isContinuousStoryNarrationEnabled, setIsContinuousStoryNarrationEnabled] =
    useState(false);
  const [isStoryPlaybackSessionActive, setIsStoryPlaybackSessionActive] = useState(false);
  const isWelcomeScenePreview = currentScenePreview?.type === "welcome";
  const isStoryScenePreview = currentScenePreview?.type === "story";
  const {
    ambientAudioSrc,
    welcomeSceneAudioSrc,
    storySceneAudioSrc,
    introAudioSrc,
    storyAudioSrc,
    storyAudioSourceType,
  } = useMemo(
    () => resolveExperienceAudio(experience, storyPageIndex),
    [experience, storyPageIndex]
  );
  const { audioRef: ambientAudioRef, isPlaying: isAmbientAudioPlaying } = usePublicAudioTrack({
    src: ambientAudioSrc,
    loop: true,
    warnLabel: "Ambient",
  });
  const { audioRef: introAudioRef, isPlaying: isIntroAudioPlaying } = usePublicAudioTrack({
    src: introAudioSrc,
    active: isWelcomeScenePreview,
    warnLabel: "Intro",
  });
  const { audioRef: welcomeSceneAudioRef, isPlaying: isWelcomeSceneAudioPlaying } =
    usePublicAudioTrack({
      src: welcomeSceneAudioSrc,
      active: isWelcomeScenePreview,
    });
  const { audioRef: storySceneAudioRef, isPlaying: isStorySceneAudioPlaying } =
    usePublicAudioTrack({
      src: storySceneAudioSrc,
      active: isStoryScenePreview,
    });
  const { audioRef: storyAudioRef, isPlaying: isStoryAudioPlaying } = usePublicAudioTrack({
    src: storyAudioSrc,
    active: isStoryScenePreview,
  });
  const shellState = useMemo(
    () =>
      buildExperienceShellState({
        enabledScenes,
        sceneIndex,
        ambientAudioSrc,
        introAudioSrc,
        storyAudioSrc,
        storyAudioSourceType,
        isAmbientAudioEnabled,
        isAmbientAudioPlaying,
        isWelcomeSceneAudioPlaying,
        isStorySceneAudioPlaying,
        isIntroAudioPlaying,
        isStoryAudioPlaying,
        isContinuousStoryNarrationEnabled,
        isStoryPlaybackSessionActive,
        storyPageIndex,
      }),
    [
      ambientAudioSrc,
      enabledScenes,
      introAudioSrc,
      isAmbientAudioEnabled,
      isAmbientAudioPlaying,
      isContinuousStoryNarrationEnabled,
      isIntroAudioPlaying,
      isStoryAudioPlaying,
      isStoryPlaybackSessionActive,
      isStorySceneAudioPlaying,
      isWelcomeSceneAudioPlaying,
      sceneIndex,
      storyAudioSourceType,
      storyAudioSrc,
      storyPageIndex,
    ]
  );

  usePublicAmbientAudio({
    audioRef: ambientAudioRef,
    ambientAudioSrc,
    isAmbientAudioEnabled,
    shouldSuppressAmbientForVoice: shellState.shouldSuppressAmbientForVoice,
  });
  usePublicStoryNarration({
    ambientAudioRef,
    storyAudioRef,
    isStoryScene: shellState.isStoryScene,
    isContinuousStoryNarrationEnabled,
    isStoryPlaybackSessionActive,
    setIsStoryPlaybackSessionActive,
    storyAudioSrc,
    storyPageIndex,
  });

  useEffect(() => {
    if (shellState.currentScene?.type !== "story") {
      setStoryPageIndex(0);
      setIsStoryPlaybackSessionActive(false);
    }
  }, [shellState.currentScene?.type]);

  async function handleAmbientToggleClick() {
    if (!ambientAudioSrc || !ambientAudioRef.current) {
      return;
    }

    if (isAmbientAudioEnabled) {
      setIsAmbientAudioEnabled(false);
      pauseAndResetAudio(ambientAudioRef);
      return;
    }

    setIsAmbientAudioEnabled(true);

    if (shellState.shouldSuppressAmbientForVoice) {
      return;
    }

    try {
      await ambientAudioRef.current.play();
    } catch (error) {
      console.warn("Ambient audio could not start.", error);
    }
  }

  async function handleWelcomeSceneAudioButtonClick() {
    if (!welcomeSceneAudioSrc || !welcomeSceneAudioRef.current) {
      return;
    }

    pauseAudio(ambientAudioRef);
    pauseAudio(introAudioRef);
    pauseAudio(storyAudioRef);
    setIsStoryPlaybackSessionActive(false);

    if (!welcomeSceneAudioRef.current.paused && !welcomeSceneAudioRef.current.ended) {
      welcomeSceneAudioRef.current.pause();
      return;
    }

    try {
      await welcomeSceneAudioRef.current.play();
    } catch {
    }
  }

  async function handleStorySceneAudioButtonClick() {
    if (!storySceneAudioSrc || !storySceneAudioRef.current) {
      return;
    }

    pauseAudio(ambientAudioRef);
    pauseAudio(introAudioRef);
    pauseAudio(storyAudioRef);
    setIsStoryPlaybackSessionActive(false);

    if (!storySceneAudioRef.current.paused && !storySceneAudioRef.current.ended) {
      storySceneAudioRef.current.pause();
      return;
    }

    try {
      await storySceneAudioRef.current.play();
    } catch {
    }
  }

  async function handleAudioButtonClick() {
    if (shellState.isWelcomeScene) {
      if (!introAudioSrc || !introAudioRef.current) {
        return;
      }

      pauseAndResetAudio(storyAudioRef);
      pauseAudio(ambientAudioRef);
      pauseAudio(welcomeSceneAudioRef);
      pauseAudio(storySceneAudioRef);

      if (!introAudioRef.current.paused && !introAudioRef.current.ended) {
        introAudioRef.current.pause();
        return;
      }

      try {
        await introAudioRef.current.play();
      } catch (error) {
        console.warn("Intro audio could not start.", error);
      }

      return;
    }

    if (shellState.isStoryScene) {
      if (!storyAudioSrc || !storyAudioRef.current) {
        return;
      }

      pauseAndResetAudio(introAudioRef);
      pauseAudio(ambientAudioRef);
      pauseAudio(welcomeSceneAudioRef);
      pauseAudio(storySceneAudioRef);

      if (!storyAudioRef.current.paused && !storyAudioRef.current.ended) {
        storyAudioRef.current.pause();
        setIsStoryPlaybackSessionActive(false);
        return;
      }

      setIsStoryPlaybackSessionActive(true);

      try {
        await storyAudioRef.current.play();
      } catch {
        setIsStoryPlaybackSessionActive(false);
      }
    }
  }

  function handleSceneChangeStart() {
    if (shellState.currentScene?.type === "welcome") {
      pauseAndResetAudio(introAudioRef);
      pauseAndResetAudio(welcomeSceneAudioRef);
    }

    if (shellState.currentScene?.type === "story") {
      setIsStoryPlaybackSessionActive(false);
      pauseAndResetAudio(storyAudioRef);
      pauseAndResetAudio(storySceneAudioRef);
    }
  }

  return {
    ...shellState,
    ambientAudioSrc,
    welcomeSceneAudioSrc,
    storySceneAudioSrc,
    isAmbientAudioEnabled,
    isWelcomeSceneAudioPlaying,
    isStorySceneAudioPlaying,
    isContinuousStoryNarrationEnabled,
    setIsContinuousStoryNarrationEnabled,
    setStoryPageIndex,
    handleAmbientToggleClick,
    handleWelcomeSceneAudioButtonClick,
    handleStorySceneAudioButtonClick,
    handleAudioButtonClick,
    handleSceneChangeStart,
  };
}
