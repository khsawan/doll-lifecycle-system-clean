const AMBIENT_PARTICLES = [
  {
    left: "6%",
    top: "78%",
    size: "96px",
    duration: "30s",
    delay: "-4s",
    driftX: "18px",
    driftY: "-180px",
    opacity: "0.2",
    blur: "0.7px",
    radius: "999px",
  },
  {
    left: "19%",
    top: "22%",
    size: "58px",
    duration: "26s",
    delay: "-12s",
    driftX: "-10px",
    driftY: "-126px",
    opacity: "0.17",
    blur: "0.45px",
    radius: "999px",
  },
  {
    left: "32%",
    top: "58%",
    size: "80px",
    duration: "32s",
    delay: "-7s",
    driftX: "16px",
    driftY: "-172px",
    opacity: "0.19",
    blur: "0.6px",
    radius: "999px",
  },
  {
    left: "48%",
    top: "14%",
    size: "108px",
    duration: "36s",
    delay: "-18s",
    driftX: "-14px",
    driftY: "-152px",
    opacity: "0.17",
    blur: "0.85px",
    radius: "999px",
  },
  {
    left: "66%",
    top: "72%",
    size: "70px",
    duration: "28s",
    delay: "-10s",
    driftX: "12px",
    driftY: "-146px",
    opacity: "0.18",
    blur: "0.55px",
    radius: "999px",
  },
  {
    left: "82%",
    top: "36%",
    size: "90px",
    duration: "34s",
    delay: "-15s",
    driftX: "-14px",
    driftY: "-168px",
    opacity: "0.18",
    blur: "0.75px",
    radius: "999px",
  },
  {
    left: "91%",
    top: "84%",
    size: "56px",
    duration: "25s",
    delay: "-21s",
    driftX: "8px",
    driftY: "-132px",
    opacity: "0.16",
    blur: "0.45px",
    radius: "999px",
  },
];

const publicExperienceWrapStyle = {
  position: "relative",
  minHeight: "100svh",
  isolation: "isolate",
  overflow: "hidden",
};

const ambientLayerStyle = {
  position: "fixed",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 1,
};

export default function PublicExperiencePageShell({ children }) {
  return (
    <div className="publicExperienceWrap" style={publicExperienceWrapStyle}>
      {children}
      <AmbientParticleLayer />
    </div>
  );
}

function AmbientParticleLayer() {
  return (
    <>
      <div aria-hidden="true" className="ambientLayer" style={ambientLayerStyle}>
        {AMBIENT_PARTICLES.map((particle, index) => (
          <span
            key={`ambient-particle-${index}`}
            className="ambientParticle"
            style={{
              "--ambient-left": particle.left,
              "--ambient-top": particle.top,
              "--ambient-size": particle.size,
              "--ambient-duration": particle.duration,
              "--ambient-delay": particle.delay,
              "--ambient-drift-x": particle.driftX,
              "--ambient-drift-y": particle.driftY,
              "--ambient-opacity": particle.opacity,
              "--ambient-blur": particle.blur,
              "--ambient-radius": particle.radius,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes ambientParticleFloat {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.9);
            opacity: 0;
          }

          18% {
            opacity: var(--ambient-opacity);
          }

          65% {
            transform: translate3d(
                calc(var(--ambient-drift-x) * 0.58),
                calc(var(--ambient-drift-y) * 0.62),
                0
              )
              rotate(5deg)
              scale(1);
            opacity: calc(var(--ambient-opacity) * 0.92);
          }

          100% {
            transform: translate3d(var(--ambient-drift-x), var(--ambient-drift-y), 0)
              rotate(10deg)
              scale(1.05);
            opacity: 0;
          }
        }

        .ambientParticle {
          position: absolute;
          left: var(--ambient-left);
          top: var(--ambient-top);
          width: var(--ambient-size);
          height: calc(var(--ambient-size) * 1.15);
          border-radius: var(--ambient-radius);
          background:
            radial-gradient(
              circle at 38% 38%,
              rgba(255, 255, 255, 0.54) 0%,
              rgba(255, 250, 244, 0.3) 36%,
              rgba(255, 235, 217, 0.12) 56%,
              rgba(255, 235, 217, 0.03) 72%,
              rgba(255, 235, 217, 0) 82%
            );
          filter: blur(var(--ambient-blur));
          box-shadow: 0 0 24px rgba(255, 244, 232, 0.12);
          opacity: var(--ambient-opacity);
          will-change: transform, opacity;
          animation: ambientParticleFloat var(--ambient-duration) linear infinite;
          animation-delay: var(--ambient-delay);
          transform: translate3d(0, 0, 0);
        }

        @media (max-width: 720px) {
          .ambientParticle {
            width: calc(var(--ambient-size) * 0.82);
            height: calc(var(--ambient-size) * 0.94);
          }
        }
      `}</style>

      <style jsx global>{`
        .publicExperienceWrap section > div {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </>
  );
}
