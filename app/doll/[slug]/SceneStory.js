"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_TRANSITION_MS = 320;

export default function SceneStory({ doll, scene, isActive, onPageIndexChange }) {
  const pages = useMemo(() => scene?.story_media?.pages || [], [scene]);
  const [pageIndex, setPageIndex] = useState(0);
  const [renderedPageIndex, setRenderedPageIndex] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    setPageIndex(0);
    setRenderedPageIndex(0);
    setIsPageVisible(true);
  }, [scene?.id]);

  useEffect(() => {
    if (typeof onPageIndexChange !== "function") {
      return;
    }

    onPageIndexChange(pageIndex);
  }, [onPageIndexChange, pageIndex]);

  useEffect(() => {
    if (!isActive || !scene?.autoplay || pages.length <= 1) {
      return undefined;
    }

    const currentPage = pages[pageIndex];
    const duration = currentPage?.duration_ms || 4200;
    const timeout = window.setTimeout(() => {
      setPageIndex((current) => (current + 1) % pages.length);
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [isActive, scene, pages, pageIndex]);

  useEffect(() => {
    if (pageIndex === renderedPageIndex) {
      return undefined;
    }

    setIsPageVisible(false);

    const swapTimeout = window.setTimeout(() => {
      setRenderedPageIndex(pageIndex);
      window.requestAnimationFrame(() => {
        setIsPageVisible(true);
      });
    }, PAGE_TRANSITION_MS / 2);

    return () => window.clearTimeout(swapTimeout);
  }, [pageIndex, renderedPageIndex]);

  const currentPage = pages[renderedPageIndex] || null;
  const progressPercent = pages.length ? ((renderedPageIndex + 1) / pages.length) * 100 : 0;

  return (
    <section style={sceneStyle}>
      <div style={panelStyle}>
        <div style={headerRowStyle}>
          <div>
            <div style={eyebrowStyle}>Story</div>
            <h2 style={titleStyle}>{doll?.name || "Story Time"}</h2>
          </div>
          <button type="button" onClick={() => setPageIndex(0)} style={replayButtonStyle}>
            Replay
          </button>
        </div>

        <div style={pageStageStyle(isPageVisible)}>
          <div style={storyVisualStyle}>
            <div style={storyVisualInnerStyle}>
              {currentPage?.image_url ? (
                <img
                  src={currentPage.image_url}
                  alt={doll?.name || "Story scene"}
                  style={storyImageStyle}
                />
              ) : (
                <div style={storyFallbackStyle}>{doll?.name || "Story"}</div>
              )}
            </div>
          </div>

          <p style={storyTextStyle}>
            {currentPage?.text || "This doll's story is coming soon."}
          </p>
        </div>

        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${progressPercent}%` }} />
        </div>

        <div style={dotRowStyle}>
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setPageIndex(pages.findIndex((item) => item.id === page.id))}
              style={dotButtonStyle(page.id === currentPage?.id)}
              aria-label={`Story page ${pages.findIndex((item) => item.id === page.id) + 1}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes storyVisualDrift {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </section>
  );
}

const sceneStyle = {
  minHeight: "100svh",
  padding: "22px 18px 34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #fefce8 0%, #fff7ed 100%)",
};

const panelStyle = {
  width: "100%",
  maxWidth: 720,
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #fde68a",
  borderRadius: 30,
  padding: 20,
  display: "grid",
  gap: 18,
  boxShadow: "0 24px 60px rgba(120, 53, 15, 0.12)",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const eyebrowStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#a16207",
  fontWeight: 700,
};

const titleStyle = {
  margin: "6px 0 0",
  fontSize: "clamp(1.9rem, 6vw, 2.8rem)",
  lineHeight: 1.02,
  color: "#7c2d12",
};

const replayButtonStyle = {
  border: "1px solid #fdba74",
  background: "rgba(255, 255, 255, 0.92)",
  color: "#9a3412",
  padding: "10px 15px",
  borderRadius: 999,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(249, 115, 22, 0.08)",
};

const storyVisualStyle = {
  width: "100%",
  borderRadius: 24,
  overflow: "hidden",
  background: "linear-gradient(180deg, #fffaf0 0%, #ffedd5 100%)",
  minHeight: 280,
  border: "1px solid rgba(251, 191, 36, 0.28)",
};

const storyVisualInnerStyle = {
  animation: "storyVisualDrift 9s ease-in-out infinite",
  willChange: "transform",
};

const storyImageStyle = {
  width: "100%",
  display: "block",
  objectFit: "cover",
  aspectRatio: "4 / 3",
};

const storyFallbackStyle = {
  minHeight: 280,
  display: "grid",
  placeItems: "center",
  color: "#9a3412",
  fontWeight: 700,
  fontSize: 28,
};

const progressTrackStyle = {
  height: 8,
  width: "100%",
  background: "#fde68a",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "#f97316",
  borderRadius: 999,
  transition: "width 260ms ease",
};

const dotRowStyle = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
};

function dotButtonStyle(isActive) {
  return {
    width: 12,
    height: 12,
    borderRadius: 999,
    border: "none",
    background: isActive ? "#f97316" : "#fed7aa",
    cursor: "pointer",
    padding: 0,
  };
}

const storyTextStyle = {
  margin: 0,
  color: "#7c2d12",
  fontSize: "clamp(1rem, 3.8vw, 1.18rem)",
  lineHeight: 1.75,
  textAlign: "center",
  minHeight: 120,
  maxWidth: 560,
  marginInline: "auto",
};

function pageStageStyle(isVisible) {
  return {
    display: "grid",
    gap: 16,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0px)" : "translateY(10px)",
    transition: `opacity ${PAGE_TRANSITION_MS}ms ease, transform ${PAGE_TRANSITION_MS}ms ease`,
    willChange: "opacity, transform",
  };
}
