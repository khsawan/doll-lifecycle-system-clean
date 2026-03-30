"use client";

import { useEffect, useRef, useState } from "react";

export default function usePublicAudioTrack({
  src = "",
  active = true,
  loop = false,
  resetOnEnded = true,
  warnLabel = "",
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);

    if (!active || !src) {
      return;
    }

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = loop;

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      if (resetOnEnded) {
        audio.currentTime = 0;
      }

      setIsPlaying(false);
    };

    const handleError = () => {
      setIsPlaying(false);

      if (warnLabel) {
        console.warn(`${warnLabel} audio could not load.`, { src });
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.currentTime = 0;

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [active, loop, resetOnEnded, src, warnLabel]);

  return {
    audioRef,
    isPlaying,
  };
}
