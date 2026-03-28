"use client";

import { useEffect, useState } from "react";

export default function SceneWelcome({ universe, doll }) {
  const backgroundImage = universe?.cover_image_url || doll?.hero_image_url || "";
  const [showName, setShowName] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const nameTimeout = window.setTimeout(() => {
      setShowName(true);
    }, 160);

    const introTimeout = window.setTimeout(() => {
      setShowIntro(true);
    }, 500);

    return () => {
      window.clearTimeout(nameTimeout);
      window.clearTimeout(introTimeout);
    };
  }, []);

  return (
    <section
      style={{
        ...sceneBaseStyle,
        background: backgroundImage
          ? `linear-gradient(180deg, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.72) 100%), url(${backgroundImage}) center / cover`
          : "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)",
      }}
    >
      <div style={sceneContentStyle}>
        <div style={sceneBadgeStyle}>{universe?.name || "Handmade World"}</div>

        <div style={heroStackStyle}>
          {doll?.hero_image_url ? (
            <div style={heroImageWrapStyle}>
              <img
                src={doll.hero_image_url}
                alt={doll?.name || "Doll"}
                style={heroImageStyle}
              />
            </div>
          ) : null}

          <div style={copyStackStyle}>
            <div style={eyebrowStyle}>Welcome</div>
            <h1 style={textRevealStyle(showName, 0, titleStyle)}>
              {doll?.name || "Handmade Doll"}
            </h1>
            <p style={textRevealStyle(showIntro, 8, bodyStyle)}>
              {doll?.short_intro ||
                "A one-of-a-kind handmade friend with a story to discover."}
            </p>
            <div style={textRevealStyle(showIntro, 8, softNoteStyle)}>
              Tap the right side to begin the story.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes welcomeHeroFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </section>
  );
}

const sceneBaseStyle = {
  minHeight: "100svh",
  width: "100%",
  position: "relative",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  padding: "22px 18px 34px",
  color: "#ffffff",
};

const sceneContentStyle = {
  width: "100%",
  maxWidth: 720,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 22,
};

const sceneBadgeStyle = {
  alignSelf: "flex-start",
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.18)",
  border: "1px solid rgba(255, 255, 255, 0.24)",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.04em",
};

const heroStackStyle = {
  display: "grid",
  gap: 22,
  alignContent: "center",
  flex: 1,
};

const heroImageWrapStyle = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
  borderRadius: 28,
  overflow: "hidden",
  background: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.28)",
  animation: "welcomeHeroFloat 8.5s ease-in-out infinite",
  willChange: "transform",
};

const heroImageStyle = {
  width: "100%",
  display: "block",
  objectFit: "cover",
  aspectRatio: "4 / 5",
};

const copyStackStyle = {
  display: "grid",
  gap: 12,
  textAlign: "center",
  width: "100%",
  maxWidth: 560,
  margin: "0 auto",
  padding: "18px 20px 20px",
  borderRadius: 28,
  background: "rgba(15, 23, 42, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.16)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
};

const eyebrowStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  opacity: 0.84,
  fontWeight: 700,
};

const titleStyle = {
  margin: 0,
  fontSize: "clamp(2.2rem, 8vw, 4.2rem)",
  lineHeight: 0.96,
  letterSpacing: "-0.04em",
};

const bodyStyle = {
  margin: 0,
  fontSize: "clamp(1rem, 3.8vw, 1.28rem)",
  lineHeight: 1.6,
  maxWidth: 520,
  marginInline: "auto",
};

const softNoteStyle = {
  fontSize: 14,
  opacity: 0.82,
};

function textRevealStyle(isVisible, offsetY, baseStyle) {
  return {
    ...baseStyle,
    opacity: isVisible ? baseStyle.opacity ?? 1 : 0,
    transform: isVisible ? "translateY(0px)" : `translateY(${offsetY}px)`,
    transition: "opacity 300ms ease, transform 300ms ease",
    willChange: "opacity, transform",
  };
}
