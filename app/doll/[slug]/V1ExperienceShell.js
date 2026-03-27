"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SceneRenderer from "./SceneRenderer";

const AMBIENT_AUDIO_SRC = "/audio/ambient-placeholder.mp3";
const AMBIENT_VOLUME = 0.28;
const AMBIENT_DUCKED_VOLUME = 0.12;
const INTRO_VOLUME = 1;
const INTRO_FADE_OUT_MS = 240;
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

export default function V1ExperienceShell({ experience }) {
  const enabledScenes = useMemo(
    () => (experience?.scenes || []).filter((scene) => scene?.enabled),
    [experience]
  );
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isSceneVisible, setIsSceneVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const ambientAudioRef = useRef(null);
  const introAudioRef = useRef(null);
  const fadeOutTimeoutRef = useRef(null);
  const fadeInTimeoutRef = useRef(null);
  const introFadeFrameRef = useRef(null);
  const introFadeInProgressRef = useRef(false);
  const ambientStartedRef = useRef(false);
  const introAttemptedRef = useRef(false);
  const introPlayingRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [ambientAudioFailed, setAmbientAudioFailed] = useState(false);
  const [introAudioFailed, setIntroAudioFailed] = useState(false);

  const currentScene = enabledScenes[sceneIndex] || null;
  const isFirstScene = sceneIndex <= 0;
  const isLastScene = sceneIndex >= enabledScenes.length - 1;
  const introAudioSrc = experience?.doll?.slug
    ? `/audio/intro/${experience.doll.slug}.mp3`
    : "";

  useEffect(() => {
    if (!ambientAudioRef.current) {
      return;
    }

    ambientAudioRef.current.volume = AMBIENT_VOLUME;
  }, []);

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

      if (introFadeFrameRef.current) {
        window.cancelAnimationFrame(introFadeFrameRef.current);
      }
    };
  }, []);

  function setAmbientVolume(nextVolume) {
    if (!ambientAudioRef.current) {
      return;
    }

    ambientAudioRef.current.volume = nextVolume;
  }

  function restoreAmbientVolume() {
    setAmbientVolume(AMBIENT_VOLUME);
  }

  function resetIntroAudioPlayback() {
    if (!introAudioRef.current) {
      return;
    }

    introAudioRef.current.pause();
    introAudioRef.current.currentTime = 0;
    introAudioRef.current.volume = INTRO_VOLUME;
  }

  function stopIntroFade() {
    if (introFadeFrameRef.current) {
      window.cancelAnimationFrame(introFadeFrameRef.current);
      introFadeFrameRef.current = null;
    }

    introFadeInProgressRef.current = false;
  }

  function handleIntroFinished() {
    stopIntroFade();
    introPlayingRef.current = false;
    if (introAudioRef.current) {
      introAudioRef.current.volume = INTRO_VOLUME;
    }
    restoreAmbientVolume();
  }

  function isIntroAudioPlaying() {
    return Boolean(
      introAudioRef.current &&
      !introAudioRef.current.paused &&
      !introAudioRef.current.ended
    );
  }

  function fadeOutIntroVoice(onComplete) {
    if (
      introFadeInProgressRef.current ||
      !introAudioRef.current ||
      introAudioRef.current.paused ||
      introAudioRef.current.ended
    ) {
      if (typeof onComplete === "function") {
        onComplete();
      }
      return;
    }

    introFadeInProgressRef.current = true;

    const audio = introAudioRef.current;
    const startingVolume = audio.volume;
    const startedAt = window.performance.now();

    const step = (timestamp) => {
      if (!introAudioRef.current) {
        stopIntroFade();
        return;
      }

      const progress = Math.min((timestamp - startedAt) / INTRO_FADE_OUT_MS, 1);
      audio.volume = Math.max(0, startingVolume * (1 - progress));

      if (progress < 1) {
        introFadeFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      resetIntroAudioPlayback();
      introPlayingRef.current = false;
      stopIntroFade();
      restoreAmbientVolume();

      if (typeof onComplete === "function") {
        onComplete();
      }
    };

    introFadeFrameRef.current = window.requestAnimationFrame(step);
  }

  async function ensureAmbientPlayback() {
    if (ambientStartedRef.current || ambientAudioFailed || !ambientAudioRef.current) {
      return;
    }

    try {
      ambientAudioRef.current.volume = AMBIENT_VOLUME;
      await ambientAudioRef.current.play();
      ambientStartedRef.current = true;
    } catch (error) {
      console.warn("Ambient audio could not start.", error);
    }
  }

  useEffect(() => {
    if (
      !hasInteracted ||
      isTransitioning ||
      currentScene?.type !== "welcome" ||
      !introAudioSrc ||
      introAudioFailed ||
      introAttemptedRef.current ||
      !introAudioRef.current
    ) {
      return;
    }

    async function playIntroVoice() {
      introAttemptedRef.current = true;
      introPlayingRef.current = true;
      setAmbientVolume(AMBIENT_DUCKED_VOLUME);

      try {
        stopIntroFade();
        introAudioRef.current.volume = INTRO_VOLUME;
        introAudioRef.current.currentTime = 0;
        await introAudioRef.current.play();
      } catch (error) {
        introPlayingRef.current = false;
        restoreAmbientVolume();
        console.warn("Intro audio could not start.", error);
      }
    }

    playIntroVoice();
  }, [currentScene?.type, hasInteracted, introAudioFailed, introAudioSrc, isTransitioning]);

  useEffect(() => {
    if (currentScene?.type === "welcome" || !introAudioRef.current || !introPlayingRef.current) {
      return;
    }

    introAudioRef.current.pause();
    introAudioRef.current.currentTime = 0;
    handleIntroFinished();
  }, [currentScene?.type]);

  function goPrevious() {
    requestSceneChange(sceneIndex - 1);
  }

  function goNext() {
    requestSceneChange(sceneIndex + 1);
  }

  async function handleFirstInteraction() {
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    await ensureAmbientPlayback();
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

    const shouldFadeWelcomeIntro =
      currentScene?.type === "welcome" && isIntroAudioPlaying();

    setIsTransitioning(true);

    if (shouldFadeWelcomeIntro) {
      fadeOutIntroVoice(() => {
        startSceneTransition(nextIndex);
      });
      return;
    }

    startSceneTransition(nextIndex);
  }

  return (
    <main style={shellStyle} onPointerDownCapture={handleFirstInteraction}>
      <audio
        ref={ambientAudioRef}
        loop
        preload="auto"
        src={AMBIENT_AUDIO_SRC}
        onError={() => setAmbientAudioFailed(true)}
      />
      <audio
        ref={introAudioRef}
        preload="auto"
        src={introAudioSrc}
        onEnded={handleIntroFinished}
        onError={() => {
          setIntroAudioFailed(true);
          handleIntroFinished();
        }}
      />

      <div style={sceneViewportStyle}>
        <div aria-hidden="true" style={ambientLayerStyle}>
          {SHELL_AMBIENT_PARTICLES.map((particle, index) => (
            <span
              key={`shell-ambient-particle-${index}`}
              className="shellAmbientParticle"
              style={{
                "--ambient-left": particle.left,
                "--ambient-top": particle.top,
                "--ambient-size": particle.size,
                "--ambient-duration": particle.duration,
                "--ambient-delay": particle.delay,
                "--ambient-drift-x": particle.driftX,
                "--ambient-drift-y": particle.driftY,
                "--ambient-opacity": particle.opacity,
              }}
            />
          ))}
        </div>

        <div style={sceneFrameStyle(isSceneVisible)}>
          <div className="shellSceneContentHost" style={sceneMotionLayerStyle}>
            <SceneRenderer
              scene={currentScene}
              experience={experience}
              isActive={!isTransitioning && isSceneVisible}
            />
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
          <div style={topBarChipStyle}>
            <div style={sceneLabelStyle}>
              {currentScene?.title || "Experience"}{" "}
              {enabledScenes.length ? `${sceneIndex + 1}/${enabledScenes.length}` : ""}
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

        @keyframes shellAmbientFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(0.96);
            opacity: calc(var(--ambient-opacity) * 0.84);
          }

          50% {
            transform: translate3d(
                calc(var(--ambient-drift-x) * 0.62),
                calc(var(--ambient-drift-y) * 0.58),
                0
              )
              scale(1);
            opacity: var(--ambient-opacity);
          }

          100% {
            transform: translate3d(var(--ambient-drift-x), var(--ambient-drift-y), 0)
              scale(1.04);
            opacity: calc(var(--ambient-opacity) * 0.9);
          }
        }

        .shellAmbientParticle {
          position: absolute;
          left: var(--ambient-left);
          top: var(--ambient-top);
          width: var(--ambient-size);
          height: var(--ambient-size);
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.72) 0%,
            rgba(255, 248, 240, 0.5) 36%,
            rgba(255, 239, 220, 0.18) 62%,
            rgba(255, 239, 220, 0) 80%
          );
          opacity: var(--ambient-opacity);
          filter: none;
          will-change: transform, opacity;
          animation: shellAmbientFloat var(--ambient-duration) ease-in-out infinite;
          animation-delay: var(--ambient-delay);
          transform: translate3d(0, 0, 0);
        }

        @media (max-width: 720px) {
          .shellAmbientParticle {
            width: calc(var(--ambient-size) * 0.9);
            height: calc(var(--ambient-size) * 0.9);
          }
        }
      `}</style>

      <style jsx global>{`
        .publicExperienceWrap > .ambientLayer {
          display: none;
        }

        .shellSceneContentHost > section > div {
          position: relative;
          z-index: 2;
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

const ambientLayerStyle = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 1,
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

const topBarChipStyle = {
  padding: "9px 12px",
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.28)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  backdropFilter: "blur(8px)",
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
