"use client";

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

export default function PublicExperienceTopBar({
  ambientAudioSrc,
  isAmbientAudioEnabled,
  ambientButtonLabel,
  onAmbientToggle,
  isWelcomeScene,
  welcomeSceneAudioSrc,
  welcomeSceneAudioButtonLabel,
  isWelcomeSceneAudioPlaying,
  onWelcomeSceneAudioToggle,
  audioButtonLabel,
  audioButtonText,
  onAudioButtonClick,
  isStoryScene,
  storySceneAudioSrc,
  storySceneAudioButtonLabel,
  isStorySceneAudioPlaying,
  onStorySceneAudioToggle,
  isContinuousStoryNarrationEnabled,
  continuousNarrationButtonLabel,
  onContinuousNarrationToggle,
  storyAudioStatusText,
  currentSceneTitle,
  sceneIndex,
  sceneCount,
}) {
  return (
    <>
      <div style={topBarStyle}>
        <div style={topBarInnerStyle}>
          <div style={topBarChipStyle}>
            <div style={brandStyle}>MAILLE & MERVEILLE</div>
          </div>
          <div style={topBarMetaStyle}>
            <button
              type="button"
              onClick={onAmbientToggle}
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
                onClick={onWelcomeSceneAudioToggle}
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
              onClick={onAudioButtonClick}
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
                onClick={onStorySceneAudioToggle}
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
                onClick={onContinuousNarrationToggle}
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
                {currentSceneTitle || "Experience"} {sceneCount ? `${sceneIndex + 1}/${sceneCount}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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
      `}</style>
    </>
  );
}
