"use client";

import { buildAmbientParticleStyleVariables } from "../domain/runtime";

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

const sceneViewportStyle = {
  position: "relative",
  minHeight: "100svh",
  width: "100%",
  overflow: "hidden",
};

function sceneFrameStyle(isVisible, transitionMs) {
  return {
    position: "relative",
    minHeight: "100svh",
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${transitionMs}ms ease`,
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

export default function PublicExperienceSceneViewport({
  ambientTheme,
  currentScene,
  sceneIndex,
  isSceneVisible,
  isTransitioning,
  transitionMs,
  children,
}) {
  return (
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
            style={buildAmbientParticleStyleVariables(particle, ambientTheme)}
          />
        ))}
      </div>

      <div style={sceneFrameStyle(isSceneVisible, transitionMs)}>
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
            {children({
              currentScene,
              isSceneActive: !isTransitioning && isSceneVisible,
            })}
          </div>
        </div>
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

        @media (max-width: 720px) {
          .shellAmbientParticle {
            width: calc(var(--ambient-size) * var(--ambient-width-scale) * 0.9);
            height: calc(var(--ambient-size) * var(--ambient-height-scale) * 0.9);
          }
        }
      `}</style>
    </div>
  );
}
