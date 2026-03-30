"use client";

function tapZoneStyle(side, isDisabled) {
  return {
    position: "fixed",
    top: "88px",
    bottom: "110px",
    [side]: 0,
    width: "clamp(72px, 14vw, 120px)",
    border: "none",
    background: "transparent",
    cursor: isDisabled ? "default" : "pointer",
    pointerEvents: isDisabled ? "none" : "auto",
    zIndex: 4,
    opacity: isDisabled ? 0 : 1,
    touchAction: "manipulation",
  };
}

const sceneControlsStyle = {
  position: "fixed",
  left: "50%",
  bottom: 16,
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.28)",
  backdropFilter: "blur(8px)",
  zIndex: 5,
};

function sceneNavButtonStyle(isDisabled) {
  return {
    border: "1px solid rgba(255, 255, 255, 0.16)",
    background: isDisabled ? "rgba(15, 23, 42, 0.18)" : "rgba(15, 23, 42, 0.4)",
    color: "rgba(255, 255, 255, 0.96)",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: isDisabled ? "default" : "pointer",
    opacity: isDisabled ? 0.52 : 1,
    touchAction: "manipulation",
  };
}

const sceneDotsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
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

export default function PublicExperienceSceneNavigation({
  goPrevious,
  goNext,
  isTransitioning,
  isFirstScene,
  isLastScene,
  enabledScenes = [],
  sceneIndex = 0,
  onSceneSelect,
}) {
  return (
    <>
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

      <div style={sceneControlsStyle}>
        <button
          type="button"
          onClick={goPrevious}
          disabled={isTransitioning || isFirstScene}
          aria-label="Previous scene button"
          style={sceneNavButtonStyle(isTransitioning || isFirstScene)}
        >
          Previous
        </button>

        <div style={sceneDotsStyle}>
          {enabledScenes.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSceneSelect(index)}
              disabled={isTransitioning || index === sceneIndex}
              aria-label={`Go to ${scene.title}`}
              style={sceneDotButtonStyle(index === sceneIndex, isTransitioning)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={isTransitioning || isLastScene}
          aria-label="Next scene button"
          style={sceneNavButtonStyle(isTransitioning || isLastScene)}
        >
          Next
        </button>
      </div>
    </>
  );
}
