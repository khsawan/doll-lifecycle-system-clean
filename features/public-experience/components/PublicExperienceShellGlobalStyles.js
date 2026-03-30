"use client";

export default function PublicExperienceShellGlobalStyles() {
  return (
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
  );
}
