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

export function selectEnabledScenes(experience) {
  return (experience?.scenes || []).filter((scene) => scene?.enabled);
}

export function resolveAmbientTheme(universeName) {
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

export function buildAmbientParticleStyleVariables(particle, ambientTheme) {
  const theme = ambientTheme || DEFAULT_AMBIENT_THEME;

  return {
    "--ambient-left": particle.left,
    "--ambient-top": particle.top,
    "--ambient-size": scaleCssValue(particle.size, theme.sizeScale),
    "--ambient-duration": scaleCssValue(particle.duration, theme.durationScale),
    "--ambient-delay": scaleCssValue(particle.delay, theme.durationScale),
    "--ambient-drift-x": scaleCssValue(particle.driftX, theme.driftScale),
    "--ambient-drift-y": scaleCssValue(particle.driftY, theme.driftScale),
    "--ambient-opacity": scaleOpacity(particle.opacity, theme.opacityScale),
  };
}

export function resolveExperienceAudio(experience, storyPageIndex) {
  return {
    ambientAudioSrc: resolveAmbientUniverseAudioUrl(experience),
    welcomeSceneAudioSrc: resolveWelcomeSceneAudioUrl(experience),
    storySceneAudioSrc: resolveStorySceneAudioUrl(experience),
    introAudioSrc: resolveIntroVoiceAudioUrl(experience),
    storyAudioSrc: resolveStoryPageVoiceAudioUrl(experience, storyPageIndex),
    storyAudioSourceType: resolveStoryPageVoiceAudioSource(experience, storyPageIndex),
  };
}

export function buildExperienceShellState({
  enabledScenes = [],
  sceneIndex = 0,
  ambientAudioSrc = "",
  introAudioSrc = "",
  storyAudioSrc = "",
  storyAudioSourceType = "none",
  isAmbientAudioEnabled = false,
  isAmbientAudioPlaying = false,
  isWelcomeSceneAudioPlaying = false,
  isStorySceneAudioPlaying = false,
  isIntroAudioPlaying = false,
  isStoryAudioPlaying = false,
  isContinuousStoryNarrationEnabled = false,
  isStoryPlaybackSessionActive = false,
  storyPageIndex = 0,
}) {
  const sceneList = Array.isArray(enabledScenes) ? enabledScenes : [];
  const currentScene = sceneList[sceneIndex] || null;
  const isFirstScene = sceneIndex <= 0;
  const isLastScene = sceneIndex >= sceneList.length - 1;
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

  return {
    currentScene,
    isFirstScene,
    isLastScene,
    isWelcomeScene,
    isStoryScene,
    shouldSuppressAmbientForVoice,
    audioButtonLabel,
    audioButtonText,
    ambientButtonLabel,
    welcomeSceneAudioButtonLabel,
    storySceneAudioButtonLabel,
    continuousNarrationButtonLabel,
    storyAudioStatusText,
  };
}
