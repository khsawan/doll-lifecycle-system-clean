"use client";

import { useEffect } from "react";
import { shouldPlayAmbientAudio } from "../domain/audio";

export default function usePublicAmbientAudio({
  audioRef,
  ambientAudioSrc = "",
  isAmbientAudioEnabled = false,
  shouldSuppressAmbientForVoice = false,
}) {
  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    if (
      !shouldPlayAmbientAudio({
        hasAudioRef: Boolean(audioRef.current),
        ambientAudioSrc,
        isAmbientAudioEnabled,
        shouldSuppressAmbientForVoice,
      })
    ) {
      if (!ambientAudioSrc || !isAmbientAudioEnabled) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else if (shouldSuppressAmbientForVoice) {
        audioRef.current.pause();
      }

      return;
    }

    let isCancelled = false;

    async function playAmbientAudio() {
      try {
        await audioRef.current.play();
      } catch (error) {
        if (!isCancelled) {
          console.warn("Ambient audio could not start.", error);
        }
      }
    }

    void playAmbientAudio();

    return () => {
      isCancelled = true;
    };
  }, [ambientAudioSrc, audioRef, isAmbientAudioEnabled, shouldSuppressAmbientForVoice]);
}
