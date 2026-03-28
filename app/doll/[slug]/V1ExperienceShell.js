"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SceneRenderer from "./SceneRenderer";

const SCENE_TRANSITION_MS = 300;
const SHELL_AMBIENT_PARTICLES = [
  {
    left: "8%",
    top: "12%",
    size: "28px",
    duration: "31s",
    delay: "-4s",
    driftX: "10px",
    driftY: "-72px",
    opacity: "0.24",
  },
  {
    left: "22%",
    top: "26%",
    size: "24px",
    duration: "27s",
    delay: "-10s",
    driftX: "-8px",
    driftY: "-64px",
    opacity: "0.2",
  },
  {
    left: "36%",
    top: "18%",
    size: "30px",
    duration: "34s",
    delay: "-6s",
    driftX: "12px",
    driftY: "-84px",
    opacity: "0.22",
  },
  {
    left: "54%",
    top: "34%",
    size: "26px",
    duration: "29s",
    delay: "-15s",
    driftX: "-10px",
    driftY: "-70px",
    opacity: "0.21",
  },
  {
    left: "68%",
    top: "16%",
    size: "32px",
    duration: "36s",
    delay: "-9s",
    driftX: "14px",
    driftY: "-88px",
    opacity: "0.23",
  },
  {
    left: "78%",
    top: "44%",
    size: "24px",
    duration: "28s",
    delay: "-13s",
    driftX: "-7px",
    driftY: "-60px",
    opacity: "0.19",
  },
  {
    left: "14%",
    top: "62%",
    size: "34px",
    duration: "38s",
    delay: "-18s",
    driftX: "11px",
    driftY: "-92px",
    opacity: "0.22",
  },
];

const DEFAULT_AMBIENT_THEME = {
  mode: "default",
  lightCoreColor: "rgba(255, 255, 255, 0.96)",
  lightCoreSoftColor: "rgba(255, 255, 255, 0.38)",
  haloShadow: "0 0 16px rgba(255, 255, 255, 0.1)",
  coreColor: "rgba(255, 255, 255, 0.82)",
  midColor: "rgba(255, 248, 240, 0.62)",
  edgeColor: "rgba(255, 239, 220, 0.24)",
  tailColor: "rgba(255, 239, 220, 0)",
  boxShadow: "0 12px 28px rgba(255, 248, 240, 0.11)",
  widthScale: "1",
  heightScale: "1",
  radius: "999px",
  rotate: "0deg",
  blur: "0px",
  sizeScale: 1,
  durationScale: 1,
  driftScale: 1,
  opacityScale: 1.1,
};

const UNIVERSE_AMBIENT_THEMES = {
  farm: {
    ...DEFAULT_AMBIENT_THEME,
    mode: "farm",
    coreColor: "rgba(255, 247, 211, 0.9)",
    midColor: "rgba(252, 211, 77, 0.58)",
    edgeColor: "rgba(245, 158, 11, 0.22)",
    tailColor: "rgba(245, 158, 11, 0)",
    boxShadow: "0 14px 30px rgba(217, 119, 6, 0.14)",
    widthScale: "0.82",
    heightScale: "1.24",
    radius: "58% 42% 60% 40% / 46% 54% 48% 52%",
    rotate: "18deg",
    sizeScale: 1.02,
    durationScale: 1.04,
    driftScale: 0.94,
    opacityScale: 1.13,
  },
  forest: {
    ...DEFAULT_AMBIENT_THEME,
    mode: "forest",
    coreColor: "rgba(220, 252, 231, 0.92)",
    midColor: "rgba(134, 239, 172, 0.6)",
    edgeColor: "rgba(34, 197, 94, 0.24)",
    tailColor: "rgba(34, 197, 94, 0)",
    boxShadow: "0 14px 30px rgba(21, 128, 61, 0.16)",
    widthScale: "0.72",
    heightScale: "1.34",
    radius: "62% 38% 64% 36% / 42% 58% 44% 56%",
    rotate: "28deg",
    sizeScale: 0.98,
    durationScale: 1.08,
    driftScale: 0.9,
    opacityScale: 1.17,
  },
  night: {
    ...DEFAULT_AMBIENT_THEME,
    mode: "night",
    lightCoreColor: "rgba(255, 255, 255, 0.98)",
    lightCoreSoftColor: "rgba(232, 240, 255, 0.46)",
    haloShadow: "0 0 20px rgba(214, 225, 255, 0.18)",
    coreColor: "rgba(255, 255, 255, 0.98)",
    midColor: "rgba(224, 231, 255, 0.7)",
    edgeColor: "rgba(191, 219, 254, 0.3)",
    tailColor: "rgba(191, 219, 254, 0)",
    boxShadow: "0 0 20px rgba(191, 219, 254, 0.36)",
    widthScale: "0.42",
    heightScale: "0.42",
    radius: "999px",
    rotate: "0deg",
    sizeScale: 0.56,
    durationScale: 1.46,
    driftScale: 0.62,
    opacityScale: 1.22,
  },
  beach: {
    ...DEFAULT_AMBIENT_THEME,
    mode: "beach",
    coreColor: "rgba(240, 249, 255, 0.92)",
    midColor: "rgba(186, 230, 253, 0.6)",
    edgeColor: "rgba(125, 211, 252, 0.28)",
    tailColor: "rgba(125, 211, 252, 0)",
    boxShadow:
      "inset 0 0 0 1px rgba(255, 255, 255, 0.34), 0 12px 28px rgba(14, 165, 233, 0.16)",
    widthScale: "1",
    heightScale: "1",
    radius: "999px",
    rotate: "0deg",
    sizeScale: 0.96,
    durationScale: 1.06,
    driftScale: 0.88,
    opacityScale: 1.13,
  },
};

function scaleCssValue(value, scale = 1) {
  if (!value || scale === 1) {
    return value;
  }

  const match = String(value).trim().match(/^(-?\d*\.?\d+)([a-z%]+)$/i);

  if (!match) {
    return value;
  }

  const [, rawNumber, unit] = match;
  const scaled = Number(rawNumber) * scale;
  return `${Number(scaled.toFixed(3))}${unit}`;
}

function scaleOpacity(value, scale = 1) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return String(Math.min(1, Math.max(0.16, numericValue * scale)));
}

function resolveAmbientTheme(universeName) {
  const normalizedUniverseName = String(universeName || "").trim().toLowerCase();

  if (normalizedUniverseName.includes("farm")) {
    return UNIVERSE_AMBIENT_THEMES.farm;
  }

  if (normalizedUniverseName.includes("forest")) {
    return UNIVERSE_AMBIENT_THEMES.forest;
  }

  if (normalizedUniverseName.includes("beach")) {
    return UNIVERSE_AMBIENT_THEMES.beach;
  }

  if (
    normalizedUniverseName.includes("night") ||
    normalizedUniverseName.includes("dream")
  ) {
    return UNIVERSE_AMBIENT_THEMES.night;
  }

  return DEFAULT_AMBIENT_THEME;
}

function normalizeAudioUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getExperienceAudioUrls(experience) {
  return (
    experience?.doll?.audio_urls ??
    experience?.doll?.audioUrls ??
    experience?.audio_urls ??
    experience?.audioUrls ??
    null
  );
}

function resolveAmbientUniverseAudioUrl(experience) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "";
  }

  return normalizeAudioUrl(audioUrls?.ambient?.universe);
}

function resolveWelcomeSceneAudioUrl(experience) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "";
  }

  return normalizeAudioUrl(audioUrls?.scene?.welcome);
}

function resolveStorySceneAudioUrl(experience) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "";
  }

  return normalizeAudioUrl(audioUrls?.scene?.story);
}

function resolveIntroVoiceAudioUrl(experience) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "";
  }

  const layeredIntroUrl = normalizeAudioUrl(audioUrls?.voice?.intro);

  if (layeredIntroUrl) {
    return layeredIntroUrl;
  }

  return normalizeAudioUrl(audioUrls?.intro);
}

function resolveStoryVoiceAudioUrl(experience) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "";
  }

  const layeredStoryUrl = normalizeAudioUrl(audioUrls?.voice?.story);

  if (layeredStoryUrl) {
    return layeredStoryUrl;
  }

  return normalizeAudioUrl(audioUrls?.story);
}

function resolveStoryPageVoiceAudioUrl(experience, pageIndex) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "";
  }

  const storyPageUrls = Array.isArray(audioUrls?.voice?.story_pages)
    ? audioUrls.voice.story_pages
    : [];
  const pageLevelStoryUrl = normalizeAudioUrl(storyPageUrls?.[pageIndex]);

  if (pageLevelStoryUrl) {
    return pageLevelStoryUrl;
  }

  return resolveStoryVoiceAudioUrl(experience);
}

function resolveStoryPageVoiceAudioSource(experience, pageIndex) {
  const audioUrls = getExperienceAudioUrls(experience);

  if (!audioUrls || typeof audioUrls !== "object" || Array.isArray(audioUrls)) {
    return "none";
  }

  const storyPageUrls = Array.isArray(audioUrls?.voice?.story_pages)
    ? audioUrls.voice.story_pages
    : [];
  const pageLevelStoryUrl = normalizeAudioUrl(storyPageUrls?.[pageIndex]);

  if (pageLevelStoryUrl) {
    return "page";
  }

  if (normalizeAudioUrl(audioUrls?.voice?.story) || normalizeAudioUrl(audioUrls?.story)) {
    return "fallback";
  }

  return "none";
}

export default function V1ExperienceShell({ experience }) {
  const enabledScenes = useMemo(
    () => (experience?.scenes || []).filter((scene) => scene?.enabled),
    [experience]
  );
  const ambientTheme = useMemo(
    () => resolveAmbientTheme(experience?.universe?.name),
    [experience?.universe?.name]
  );
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isSceneVisible, setIsSceneVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const ambientAudioRef = useRef(null);
  const welcomeSceneAudioRef = useRef(null);
  const storySceneAudioRef = useRef(null);
  const introAudioRef = useRef(null);
  const storyAudioRef = useRef(null);
  const previousStoryPageIndexRef = useRef(0);
  const fadeOutTimeoutRef = useRef(null);
  const fadeInTimeoutRef = useRef(null);
  const [isAmbientAudioEnabled, setIsAmbientAudioEnabled] = useState(false);
  const [isAmbientAudioPlaying, setIsAmbientAudioPlaying] = useState(false);
  const [isWelcomeSceneAudioPlaying, setIsWelcomeSceneAudioPlaying] = useState(false);
  const [isStorySceneAudioPlaying, setIsStorySceneAudioPlaying] = useState(false);
  const [isIntroAudioPlaying, setIsIntroAudioPlaying] = useState(false);
  const [isStoryAudioPlaying, setIsStoryAudioPlaying] = useState(false);
  const [storyPageIndex, setStoryPageIndex] = useState(0);
  const [isContinuousStoryNarrationEnabled, setIsContinuousStoryNarrationEnabled] =
    useState(false);
  const [isStoryPlaybackSessionActive, setIsStoryPlaybackSessionActive] = useState(false);

  const currentScene = enabledScenes[sceneIndex] || null;
  const isFirstScene = sceneIndex <= 0;
  const isLastScene = sceneIndex >= enabledScenes.length - 1;
  const ambientAudioSrc = useMemo(
    () => resolveAmbientUniverseAudioUrl(experience),
    [experience]
  );
  const welcomeSceneAudioSrc = useMemo(
    () => resolveWelcomeSceneAudioUrl(experience),
    [experience]
  );
  const storySceneAudioSrc = useMemo(
    () => resolveStorySceneAudioUrl(experience),
    [experience]
  );
  const introAudioSrc = useMemo(() => resolveIntroVoiceAudioUrl(experience), [experience]);
  const storyAudioSrc = useMemo(
    () => resolveStoryPageVoiceAudioUrl(experience, storyPageIndex),
    [experience, storyPageIndex]
  );
  const storyAudioSourceType = useMemo(
    () => resolveStoryPageVoiceAudioSource(experience, storyPageIndex),
    [experience, storyPageIndex]
  );
  const isWelcomeScene = currentScene?.type === "welcome";
  const isStoryScene = currentScene?.type === "story";
  const shouldSuppressAmbientForVoice =
    isIntroAudioPlaying ||
    isStoryAudioPlaying ||
    isWelcomeSceneAudioPlaying ||
    isStorySceneAudioPlaying ||
    (isStoryScene &&
      isContinuousStoryNarrationEnabled &&
      isStoryPlaybackSessionActive);
  const audioButtonLabel = isWelcomeScene
    ? isIntroAudioPlaying
      ? "Pause intro audio"
      : "Play intro audio"
    : isStoryScene
      ? isStoryAudioPlaying
        ? "Pause story audio"
        : "Play story audio"
      : "Audio";
  const audioButtonText = isWelcomeScene
    ? introAudioSrc
      ? isIntroAudioPlaying
        ? "Pause Intro"
        : "Play Intro"
      : "No Intro Audio"
    : isStoryScene
      ? storyAudioSrc
        ? isStoryAudioPlaying
          ? "Pause Story"
          : "Play Story"
        : "No Story Audio"
      : "Audio";
  const ambientButtonLabel = !ambientAudioSrc
    ? "Ambient unavailable"
    : isAmbientAudioEnabled
      ? isAmbientAudioPlaying
        ? "Ambient On"
        : "Ambient Enabled"
      : "Ambient Off";
  const welcomeSceneAudioButtonLabel = isWelcomeSceneAudioPlaying
    ? "Pause welcome scene audio"
    : "Play welcome scene audio";
  const storySceneAudioButtonLabel = isStorySceneAudioPlaying
    ? "Pause story scene audio"
    : "Play story scene audio";
  const continuousNarrationButtonLabel = isContinuousStoryNarrationEnabled
    ? "Continuous Narration: On"
    : "Continuous Narration: Off";
  const storyAudioStatusText = !isStoryScene
    ? ""
    : storyAudioSourceType === "page"
      ? isStoryAudioPlaying
        ? `Page ${storyPageIndex + 1} narration playing`
        : `Page ${storyPageIndex + 1} narration ready`
      : storyAudioSourceType === "fallback"
        ? isStoryAudioPlaying
          ? "Scene narration fallback playing"
          : "Scene narration fallback ready"
        : "No story narration available";

  useEffect(() => {
    if (!enabledScenes.length) {
      return;
    }

    if (sceneIndex > enabledScenes.length - 1) {
      setSceneIndex(enabledScenes.length - 1);
    }
  }, [enabledScenes.length, sceneIndex]);

  useEffect(() => {
    return () => {
      if (fadeOutTimeoutRef.current) {
        window.clearTimeout(fadeOutTimeoutRef.current);
      }

      if (fadeInTimeoutRef.current) {
        window.clearTimeout(fadeInTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
      ambientAudioRef.current = null;
    }

    setIsAmbientAudioPlaying(false);

    if (!ambientAudioSrc) {
      return;
    }

    const audio = new Audio(ambientAudioSrc);
    audio.preload = "auto";
    audio.loop = true;

    const handlePlay = () => {
      setIsAmbientAudioPlaying(true);
    };

    const handlePause = () => {
      setIsAmbientAudioPlaying(false);
    };

    const handleError = () => {
      setIsAmbientAudioPlaying(false);
      console.warn("Ambient audio could not load.", { src: ambientAudioSrc });
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    ambientAudioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.currentTime = 0;

      if (ambientAudioRef.current === audio) {
        ambientAudioRef.current = null;
      }
    };
  }, [ambientAudioSrc]);

  useEffect(() => {
    if (!ambientAudioRef.current) {
      return;
    }

    if (!ambientAudioSrc || !isAmbientAudioEnabled) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
      return;
    }

    if (shouldSuppressAmbientForVoice) {
      ambientAudioRef.current.pause();
      return;
    }

    let isCancelled = false;

    async function playAmbientAudio() {
      try {
        await ambientAudioRef.current.play();
      } catch (error) {
        if (!isCancelled) {
          console.warn("Ambient audio could not start.", error);
        }
      }
    }

    playAmbientAudio();

    return () => {
      isCancelled = true;
    };
  }, [ambientAudioSrc, isAmbientAudioEnabled, shouldSuppressAmbientForVoice]);

  useEffect(() => {
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
      introAudioRef.current = null;
    }

    setIsIntroAudioPlaying(false);

    if (!introAudioSrc) {
      return;
    }

    const audio = new Audio(introAudioSrc);
    audio.preload = "auto";

    const handlePlay = () => {
      setIsIntroAudioPlaying(true);
    };

    const handlePause = () => {
      setIsIntroAudioPlaying(false);
    };

    const handleEnded = () => {
      audio.currentTime = 0;
      setIsIntroAudioPlaying(false);
    };

    const handleError = () => {
      setIsIntroAudioPlaying(false);
      console.warn("Intro audio could not load.", { src: introAudioSrc });
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    introAudioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.currentTime = 0;

      if (introAudioRef.current === audio) {
        introAudioRef.current = null;
      }
    };
  }, [introAudioSrc]);

  useEffect(() => {
    if (welcomeSceneAudioRef.current) {
      welcomeSceneAudioRef.current.pause();
      welcomeSceneAudioRef.current.currentTime = 0;
      welcomeSceneAudioRef.current = null;
    }

    setIsWelcomeSceneAudioPlaying(false);

    if (!isWelcomeScene || !welcomeSceneAudioSrc) {
      return;
    }

    const audio = new Audio(welcomeSceneAudioSrc);
    audio.preload = "auto";

    const handlePlay = () => {
      setIsWelcomeSceneAudioPlaying(true);
    };

    const handlePause = () => {
      setIsWelcomeSceneAudioPlaying(false);
    };

    const handleEnded = () => {
      audio.currentTime = 0;
      setIsWelcomeSceneAudioPlaying(false);
    };

    const handleError = () => {
      setIsWelcomeSceneAudioPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    welcomeSceneAudioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.currentTime = 0;

      if (welcomeSceneAudioRef.current === audio) {
        welcomeSceneAudioRef.current = null;
      }
    };
  }, [isWelcomeScene, welcomeSceneAudioSrc]);

  useEffect(() => {
    if (storySceneAudioRef.current) {
      storySceneAudioRef.current.pause();
      storySceneAudioRef.current.currentTime = 0;
      storySceneAudioRef.current = null;
    }

    setIsStorySceneAudioPlaying(false);

    if (!isStoryScene || !storySceneAudioSrc) {
      return;
    }

    const audio = new Audio(storySceneAudioSrc);
    audio.preload = "auto";

    const handlePlay = () => {
      setIsStorySceneAudioPlaying(true);
    };

    const handlePause = () => {
      setIsStorySceneAudioPlaying(false);
    };

    const handleEnded = () => {
      audio.currentTime = 0;
      setIsStorySceneAudioPlaying(false);
    };

    const handleError = () => {
      setIsStorySceneAudioPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    storySceneAudioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.currentTime = 0;

      if (storySceneAudioRef.current === audio) {
        storySceneAudioRef.current = null;
      }
    };
  }, [isStoryScene, storySceneAudioSrc]);

  useEffect(() => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      storyAudioRef.current.currentTime = 0;
      storyAudioRef.current = null;
    }

    setIsStoryAudioPlaying(false);

    if (!isStoryScene || !storyAudioSrc) {
      return;
    }

    const audio = new Audio(storyAudioSrc);
    audio.preload = "auto";

    const handlePlay = () => {
      setIsStoryAudioPlaying(true);
    };

    const handlePause = () => {
      setIsStoryAudioPlaying(false);
    };

    const handleEnded = () => {
      audio.currentTime = 0;
      setIsStoryAudioPlaying(false);
    };

    const handleError = () => {
      setIsStoryAudioPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    storyAudioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.currentTime = 0;

      if (storyAudioRef.current === audio) {
        storyAudioRef.current = null;
      }
    };
  }, [isStoryScene, storyAudioSrc, storyPageIndex]);

  useEffect(() => {
    if (currentScene?.type === "welcome" || !introAudioRef.current) {
      return;
    }

    introAudioRef.current.pause();
    introAudioRef.current.currentTime = 0;
  }, [currentScene?.type]);

  useEffect(() => {
    if (currentScene?.type === "story" || !storyAudioRef.current) {
      return;
    }

    storyAudioRef.current.pause();
    storyAudioRef.current.currentTime = 0;
  }, [currentScene?.type]);

  useEffect(() => {
    if (currentScene?.type !== "story") {
      setStoryPageIndex(0);
      setIsStoryPlaybackSessionActive(false);
    }
  }, [currentScene?.type]);

  useEffect(() => {
    const previousStoryPageIndex = previousStoryPageIndexRef.current;
    previousStoryPageIndexRef.current = storyPageIndex;

    if (
      !isStoryScene ||
      !isContinuousStoryNarrationEnabled ||
      !isStoryPlaybackSessionActive ||
      !storyAudioSrc ||
      !storyAudioRef.current
    ) {
      return;
    }

    if (storyPageIndex === previousStoryPageIndex) {
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

    autoplayStoryNarration();

    return () => {
      isCancelled = true;
    };
  }, [
    isContinuousStoryNarrationEnabled,
    isStoryPlaybackSessionActive,
    isStoryScene,
    storyAudioSrc,
    storyPageIndex,
  ]);

  function goPrevious() {
    requestSceneChange(sceneIndex - 1);
  }

  function goNext() {
    requestSceneChange(sceneIndex + 1);
  }

  async function handleAmbientToggleClick() {
    if (!ambientAudioSrc || !ambientAudioRef.current) {
      return;
    }

    if (isAmbientAudioEnabled) {
      setIsAmbientAudioEnabled(false);
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
      return;
    }

    setIsAmbientAudioEnabled(true);

    if (shouldSuppressAmbientForVoice) {
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

    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
    }

    if (introAudioRef.current) {
      introAudioRef.current.pause();
    }

    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      setIsStoryPlaybackSessionActive(false);
    }

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

    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
    }

    if (introAudioRef.current) {
      introAudioRef.current.pause();
    }

    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      setIsStoryPlaybackSessionActive(false);
    }

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
    if (isWelcomeScene) {
      if (!introAudioSrc || !introAudioRef.current) {
        return;
      }

      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
        storyAudioRef.current.currentTime = 0;
      }

      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }

      if (welcomeSceneAudioRef.current) {
        welcomeSceneAudioRef.current.pause();
      }

      if (storySceneAudioRef.current) {
        storySceneAudioRef.current.pause();
      }

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

    if (isStoryScene) {
      if (!storyAudioSrc || !storyAudioRef.current) {
        return;
      }

      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current.currentTime = 0;
      }

      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }

      if (welcomeSceneAudioRef.current) {
        welcomeSceneAudioRef.current.pause();
      }

      if (storySceneAudioRef.current) {
        storySceneAudioRef.current.pause();
      }

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

  function startSceneTransition(nextIndex) {
    setIsSceneVisible(false);

    fadeOutTimeoutRef.current = window.setTimeout(() => {
      setSceneIndex(nextIndex);
      window.requestAnimationFrame(() => {
        setIsSceneVisible(true);
      });

      fadeInTimeoutRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
      }, SCENE_TRANSITION_MS);
    }, SCENE_TRANSITION_MS);
  }

  function requestSceneChange(nextIndex) {
    if (
      isTransitioning ||
      nextIndex < 0 ||
      nextIndex > enabledScenes.length - 1 ||
      nextIndex === sceneIndex
    ) {
      return;
    }

    if (fadeOutTimeoutRef.current) {
      window.clearTimeout(fadeOutTimeoutRef.current);
    }

    if (fadeInTimeoutRef.current) {
      window.clearTimeout(fadeInTimeoutRef.current);
    }

    setIsTransitioning(true);

    if (currentScene?.type === "welcome" && introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }

    if (currentScene?.type === "welcome" && welcomeSceneAudioRef.current) {
      welcomeSceneAudioRef.current.pause();
      welcomeSceneAudioRef.current.currentTime = 0;
    }

    if (currentScene?.type === "story") {
      setIsStoryPlaybackSessionActive(false);

      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
        storyAudioRef.current.currentTime = 0;
      }

      if (storySceneAudioRef.current) {
        storySceneAudioRef.current.pause();
        storySceneAudioRef.current.currentTime = 0;
      }
    }

    startSceneTransition(nextIndex);
  }

  return (
    <main style={shellStyle}>
      <div style={sceneViewportStyle}>
        <div
          aria-hidden="true"
          data-universe-atmosphere={ambientTheme.mode}
          style={ambientLayerStyle(ambientTheme)}
        >
          {SHELL_AMBIENT_PARTICLES.map((particle, index) => (
            <span
              key={`shell-ambient-particle-${index}`}
              className="shellAmbientParticle"
              style={{
                "--ambient-left": particle.left,
                "--ambient-top": particle.top,
                "--ambient-size": scaleCssValue(particle.size, ambientTheme.sizeScale),
                "--ambient-duration": scaleCssValue(
                  particle.duration,
                  ambientTheme.durationScale
                ),
                "--ambient-delay": scaleCssValue(particle.delay, ambientTheme.durationScale),
                "--ambient-drift-x": scaleCssValue(particle.driftX, ambientTheme.driftScale),
                "--ambient-drift-y": scaleCssValue(particle.driftY, ambientTheme.driftScale),
                "--ambient-opacity": scaleOpacity(particle.opacity, ambientTheme.opacityScale),
              }}
            />
          ))}
        </div>

        <div style={sceneFrameStyle(isSceneVisible)}>
          <div
            key={currentScene?.id || `${currentScene?.type || "scene"}-${sceneIndex}`}
            className="shellSceneEntrance"
            style={sceneEntranceLayerStyle}
          >
            <div
              className="shellSceneContentHost"
              data-scene-type={currentScene?.type || ""}
              style={sceneMotionLayerStyle}
            >
              <SceneRenderer
                scene={currentScene}
                experience={experience}
                isActive={!isTransitioning && isSceneVisible}
                onStoryPageIndexChange={setStoryPageIndex}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous scene"
        onClick={goPrevious}
        disabled={isTransitioning || isFirstScene}
        style={tapZoneStyle("left", isTransitioning || isFirstScene)}
      />
      <button
        type="button"
        aria-label="Next scene"
        onClick={goNext}
        disabled={isTransitioning || isLastScene}
        style={tapZoneStyle("right", isTransitioning || isLastScene)}
      />

      <div style={topBarStyle}>
        <div style={topBarInnerStyle}>
          <div style={topBarChipStyle}>
            <div style={brandStyle}>MAILLE & MERVEILLE</div>
          </div>
          <div style={topBarMetaStyle}>
            <button
              type="button"
              onClick={handleAmbientToggleClick}
              disabled={!ambientAudioSrc}
              aria-pressed={ambientAudioSrc ? isAmbientAudioEnabled : false}
              aria-label={ambientButtonLabel}
              title={ambientButtonLabel}
              style={ambientToggleStyle(isAmbientAudioEnabled, !ambientAudioSrc)}
            >
              <span style={ambientToggleTextStyle}>{ambientButtonLabel}</span>
            </button>
            {isWelcomeScene && welcomeSceneAudioSrc ? (
              <button
                type="button"
                onClick={handleWelcomeSceneAudioButtonClick}
                aria-label={welcomeSceneAudioButtonLabel}
                title={welcomeSceneAudioButtonLabel}
                style={ambientToggleStyle(isWelcomeSceneAudioPlaying, false)}
              >
                <span style={ambientToggleTextStyle}>
                  {isWelcomeSceneAudioPlaying ? "Pause Welcome Scene" : "Play Welcome Scene"}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              className="audioComingSoonButton"
              onClick={handleAudioButtonClick}
              aria-label={audioButtonLabel}
              title={audioButtonLabel}
              style={audioButtonStyle}
            >
              <span aria-hidden="true" style={audioIconWrapStyle}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={audioIconStyle}
                >
                  <path
                    d="M5 14V10C5 9.44772 5.44772 9 6 9H9.2L13.2 5.8C13.8544 5.27651 14.8239 5.74244 14.8239 6.58067V17.4193C14.8239 18.2576 13.8544 18.7235 13.2 18.2L9.2 15H6C5.44772 15 5 14.5523 5 14Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.25 9.25C18.4186 10.3164 19 11.2361 19 12.5C19 13.7639 18.4186 14.6836 17.25 15.75"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span style={audioButtonLabelStyle}>{audioButtonText}</span>
            </button>
            {isStoryScene && storySceneAudioSrc ? (
              <button
                type="button"
                onClick={handleStorySceneAudioButtonClick}
                aria-label={storySceneAudioButtonLabel}
                title={storySceneAudioButtonLabel}
                style={ambientToggleStyle(isStorySceneAudioPlaying, false)}
              >
                <span style={ambientToggleTextStyle}>
                  {isStorySceneAudioPlaying ? "Pause Story Scene" : "Play Story Scene"}
                </span>
              </button>
            ) : null}
            {isStoryScene ? (
              <button
                type="button"
                onClick={() =>
                  setIsContinuousStoryNarrationEnabled((currentValue) => !currentValue)
                }
                aria-pressed={isContinuousStoryNarrationEnabled}
                aria-label={continuousNarrationButtonLabel}
                title={continuousNarrationButtonLabel}
                style={continuousNarrationToggleStyle(isContinuousStoryNarrationEnabled)}
              >
                <span style={continuousNarrationTextStyle}>
                  {continuousNarrationButtonLabel}
                </span>
              </button>
            ) : null}
            {isStoryScene ? (
              <div style={topBarChipStyle} aria-live="polite">
                <div style={audioStatusLabelStyle}>{storyAudioStatusText}</div>
              </div>
            ) : null}
            <div style={topBarChipStyle}>
              <div style={sceneLabelStyle}>
                {currentScene?.title || "Experience"}{" "}
                {enabledScenes.length ? `${sceneIndex + 1}/${enabledScenes.length}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={sceneDotsStyle}>
        {enabledScenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => requestSceneChange(index)}
            disabled={isTransitioning || index === sceneIndex}
            aria-label={`Go to ${scene.title}`}
            style={sceneDotButtonStyle(index === sceneIndex, isTransitioning)}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shellSceneDrift {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes shellSceneEntrance {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shellAmbientFloat {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--ambient-rotate)) scale(0.96);
            opacity: calc(var(--ambient-opacity) * 0.84);
          }

          50% {
            transform: translate3d(
                calc(var(--ambient-drift-x) * 0.62),
                calc(var(--ambient-drift-y) * 0.58),
                0
              )
              rotate(var(--ambient-rotate))
              scale(1);
            opacity: var(--ambient-opacity);
          }

          100% {
            transform: translate3d(var(--ambient-drift-x), var(--ambient-drift-y), 0)
              rotate(var(--ambient-rotate))
              scale(1.04);
            opacity: calc(var(--ambient-opacity) * 0.9);
          }
        }

        .shellAmbientParticle {
          position: absolute;
          left: var(--ambient-left);
          top: var(--ambient-top);
          width: calc(var(--ambient-size) * var(--ambient-width-scale));
          height: calc(var(--ambient-size) * var(--ambient-height-scale));
          border-radius: var(--ambient-radius);
          background: radial-gradient(
            circle at 36% 32%,
            var(--ambient-light-core-color) 0%,
            var(--ambient-light-core-soft-color) 20%,
            rgba(255, 255, 255, 0) 40%
          ),
          radial-gradient(
            circle at 50% 50%,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.08) 32%,
            rgba(255, 255, 255, 0) 58%
          ),
          radial-gradient(
            circle at 40% 35%,
            var(--ambient-core-color) 0%,
            var(--ambient-mid-color) 46%,
            var(--ambient-edge-color) 70%,
            var(--ambient-tail-color) 100%
          );
          opacity: var(--ambient-opacity);
          filter: blur(var(--ambient-blur));
          box-shadow:
            0 0 14px rgba(255, 255, 255, 0.08),
            var(--ambient-halo-shadow),
            var(--ambient-box-shadow);
          will-change: transform, opacity;
          animation: shellAmbientFloat var(--ambient-duration) ease-in-out infinite;
          animation-delay: var(--ambient-delay);
          transform: translate3d(0, 0, 0) rotate(var(--ambient-rotate));
          transform-origin: center center;
        }

        .shellSceneEntrance {
          min-height: 100svh;
          animation: shellSceneEntrance 0.6s ease-out both;
          will-change: transform, opacity;
        }

        .audioComingSoonButton {
          transition:
            transform 0.22s ease-out,
            box-shadow 0.22s ease-out,
            background 0.22s ease-out,
            border-color 0.22s ease-out;
        }

        @media (hover: hover) and (pointer: fine) {
          .audioComingSoonButton:hover {
            transform: translateY(-1px);
            background: rgba(15, 23, 42, 0.42) !important;
            border-color: rgba(255, 255, 255, 0.24) !important;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.14);
          }
        }

        @media (max-width: 720px) {
          .shellAmbientParticle {
            width: calc(var(--ambient-size) * var(--ambient-width-scale) * 0.9);
            height: calc(var(--ambient-size) * var(--ambient-height-scale) * 0.9);
          }
        }
      `}</style>

      <style jsx global>{`
        @keyframes shellHeroBreath {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.02);
          }

          100% {
            transform: scale(1);
          }
        }

        .publicExperienceWrap > .ambientLayer {
          display: none;
        }

        .shellSceneContentHost > section > div {
          position: relative;
          z-index: 2;
        }

        .shellSceneContentHost[data-scene-type="welcome"]
          > section
          > div
          > div:nth-child(2)
          > div:has(> img) {
          animation: shellHeroBreath 4.8s ease-in-out infinite !important;
          transform-origin: center center !important;
          will-change: transform !important;
        }

        .shellSceneContentHost[data-scene-type="play"] > section > div button[type="button"] {
          transition: transform 0.24s ease-out, box-shadow 0.24s ease-out;
          will-change: transform, box-shadow;
        }

        @media (hover: hover) and (pointer: fine) {
          .shellSceneContentHost[data-scene-type="play"]
            > section
            > div
            button[type="button"]:hover {
            transform: translateY(-4px);
            box-shadow: 0 18px 34px rgba(14, 165, 233, 0.16) !important;
          }
        }
      `}</style>
    </main>
  );
}

const shellStyle = {
  position: "relative",
  minHeight: "100svh",
  width: "100%",
  overflow: "hidden",
  background: "#0f172a",
};

const sceneViewportStyle = {
  position: "relative",
  minHeight: "100svh",
  width: "100%",
  overflow: "hidden",
};

function sceneFrameStyle(isVisible) {
  return {
    position: "relative",
    minHeight: "100svh",
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${SCENE_TRANSITION_MS}ms ease`,
    willChange: "opacity",
  };
}

function ambientLayerStyle(theme) {
  return {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 1,
    "--ambient-light-core-color": theme.lightCoreColor,
    "--ambient-light-core-soft-color": theme.lightCoreSoftColor,
    "--ambient-halo-shadow": theme.haloShadow,
    "--ambient-core-color": theme.coreColor,
    "--ambient-mid-color": theme.midColor,
    "--ambient-edge-color": theme.edgeColor,
    "--ambient-tail-color": theme.tailColor,
    "--ambient-box-shadow": theme.boxShadow,
    "--ambient-width-scale": theme.widthScale,
    "--ambient-height-scale": theme.heightScale,
    "--ambient-radius": theme.radius,
    "--ambient-rotate": theme.rotate,
    "--ambient-blur": theme.blur,
  };
}

const sceneEntranceLayerStyle = {
  minHeight: "100svh",
};

const sceneMotionLayerStyle = {
  minHeight: "100svh",
  animation: "shellSceneDrift 10s ease-in-out infinite",
  transformOrigin: "center center",
  willChange: "transform",
};

function tapZoneStyle(side, isDisabled) {
  return {
    position: "fixed",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: "32vw",
    minWidth: 96,
    border: "none",
    background: "transparent",
    cursor: isDisabled ? "default" : "pointer",
    zIndex: 4,
    opacity: isDisabled ? 0 : 1,
  };
}

const topBarStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 0",
  zIndex: 5,
  pointerEvents: "none",
};

const topBarInnerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  width: "100%",
  maxWidth: 760,
  margin: "0 auto",
};

const topBarMetaStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 10,
};

const topBarChipStyle = {
  padding: "9px 12px",
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.28)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  backdropFilter: "blur(8px)",
};

const audioButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 11px",
  borderRadius: 999,
  border: "1px solid rgba(255, 255, 255, 0.16)",
  background: "rgba(15, 23, 42, 0.32)",
  color: "#ffffff",
  cursor: "pointer",
  pointerEvents: "auto",
  backdropFilter: "blur(8px)",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.1)",
};

const audioIconWrapStyle = {
  width: 18,
  height: 18,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.94,
};

const audioIconStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

const audioButtonLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const audioStatusLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#ffffff",
  fontWeight: 700,
  whiteSpace: "nowrap",
  textShadow: "0 2px 8px rgba(15, 23, 42, 0.4)",
};

function continuousNarrationToggleStyle(isEnabled) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 12px",
    borderRadius: 999,
    border: isEnabled
      ? "1px solid rgba(255, 255, 255, 0.3)"
      : "1px solid rgba(255, 255, 255, 0.16)",
    background: isEnabled ? "rgba(255, 255, 255, 0.16)" : "rgba(15, 23, 42, 0.32)",
    color: "#ffffff",
    cursor: "pointer",
    pointerEvents: "auto",
    backdropFilter: "blur(8px)",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.1)",
  };
}

function ambientToggleStyle(isEnabled, isDisabled) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 12px",
    borderRadius: 999,
    border: isEnabled
      ? "1px solid rgba(255, 255, 255, 0.3)"
      : "1px solid rgba(255, 255, 255, 0.16)",
    background: isEnabled ? "rgba(255, 255, 255, 0.16)" : "rgba(15, 23, 42, 0.32)",
    color: "#ffffff",
    cursor: isDisabled ? "default" : "pointer",
    pointerEvents: "auto",
    opacity: isDisabled ? 0.64 : 1,
    backdropFilter: "blur(8px)",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.1)",
  };
}

const continuousNarrationTextStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
  textShadow: "0 2px 8px rgba(15, 23, 42, 0.4)",
};

const ambientToggleTextStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
  textShadow: "0 2px 8px rgba(15, 23, 42, 0.4)",
};

const brandStyle = {
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#ffffff",
  fontWeight: 700,
  textShadow: "0 2px 8px rgba(15, 23, 42, 0.4)",
};

const sceneLabelStyle = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#ffffff",
  fontWeight: 700,
  textShadow: "0 2px 8px rgba(15, 23, 42, 0.4)",
};

const sceneDotsStyle = {
  position: "fixed",
  left: "50%",
  bottom: 16,
  transform: "translateX(-50%)",
  display: "flex",
  gap: 10,
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.28)",
  backdropFilter: "blur(8px)",
  zIndex: 5,
};

function sceneDotButtonStyle(isActive, isTransitioning) {
  return {
    width: 10,
    height: 10,
    padding: 0,
    borderRadius: 999,
    border: "none",
    background: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.36)",
    cursor: isTransitioning ? "default" : "pointer",
    opacity: isTransitioning && !isActive ? 0.72 : 1,
  };
}
