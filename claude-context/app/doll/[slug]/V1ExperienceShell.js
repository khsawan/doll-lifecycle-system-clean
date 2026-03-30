"use client";

import PublicExperienceSceneNavigation from "../../../features/public-experience/components/PublicExperienceSceneNavigation";
import PublicExperienceShellGlobalStyles from "../../../features/public-experience/components/PublicExperienceShellGlobalStyles";
import PublicExperienceSceneViewport from "../../../features/public-experience/components/PublicExperienceSceneViewport";
import PublicExperienceTopBar from "../../../features/public-experience/components/PublicExperienceTopBar";
import { usePublicExperienceShellController } from "../../../features/public-experience/hooks/usePublicExperienceShellController";
import SceneRenderer from "./SceneRenderer";

export default function V1ExperienceShell({ experience }) {
  const {
    ambientTheme,
    currentScene,
    sceneIndex,
    enabledScenes,
    isSceneVisible,
    isTransitioning,
    requestSceneChange,
    goPrevious,
    goNext,
    transitionMs,
    ambientAudioSrc,
    isAmbientAudioEnabled,
    ambientButtonLabel,
    handleAmbientToggleClick,
    isWelcomeScene,
    welcomeSceneAudioSrc,
    welcomeSceneAudioButtonLabel,
    isWelcomeSceneAudioPlaying,
    handleWelcomeSceneAudioButtonClick,
    audioButtonLabel,
    audioButtonText,
    handleAudioButtonClick,
    isStoryScene,
    storySceneAudioSrc,
    storySceneAudioButtonLabel,
    isStorySceneAudioPlaying,
    handleStorySceneAudioButtonClick,
    isContinuousStoryNarrationEnabled,
    continuousNarrationButtonLabel,
    setIsContinuousStoryNarrationEnabled,
    storyAudioStatusText,
    setStoryPageIndex,
  } = usePublicExperienceShellController({
    experience,
  });

  return (
    <main style={shellStyle}>
      <PublicExperienceSceneViewport
        ambientTheme={ambientTheme}
        currentScene={currentScene}
        sceneIndex={sceneIndex}
        isSceneVisible={isSceneVisible}
        isTransitioning={isTransitioning}
        transitionMs={transitionMs}
      >
        {({ currentScene: activeScene, isSceneActive }) => (
          <SceneRenderer
            scene={activeScene}
            experience={experience}
            isActive={isSceneActive}
            onStoryPageIndexChange={setStoryPageIndex}
          />
        )}
      </PublicExperienceSceneViewport>

      <PublicExperienceSceneNavigation
        goPrevious={goPrevious}
        goNext={goNext}
        isTransitioning={isTransitioning}
        isFirstScene={sceneIndex <= 0}
        isLastScene={sceneIndex >= enabledScenes.length - 1}
        enabledScenes={enabledScenes}
        sceneIndex={sceneIndex}
        onSceneSelect={requestSceneChange}
      />

      <PublicExperienceTopBar
        ambientAudioSrc={ambientAudioSrc}
        isAmbientAudioEnabled={isAmbientAudioEnabled}
        ambientButtonLabel={ambientButtonLabel}
        onAmbientToggle={handleAmbientToggleClick}
        isWelcomeScene={isWelcomeScene}
        welcomeSceneAudioSrc={welcomeSceneAudioSrc}
        welcomeSceneAudioButtonLabel={welcomeSceneAudioButtonLabel}
        isWelcomeSceneAudioPlaying={isWelcomeSceneAudioPlaying}
        onWelcomeSceneAudioToggle={handleWelcomeSceneAudioButtonClick}
        audioButtonLabel={audioButtonLabel}
        audioButtonText={audioButtonText}
        onAudioButtonClick={handleAudioButtonClick}
        isStoryScene={isStoryScene}
        storySceneAudioSrc={storySceneAudioSrc}
        storySceneAudioButtonLabel={storySceneAudioButtonLabel}
        isStorySceneAudioPlaying={isStorySceneAudioPlaying}
        onStorySceneAudioToggle={handleStorySceneAudioButtonClick}
        isContinuousStoryNarrationEnabled={isContinuousStoryNarrationEnabled}
        continuousNarrationButtonLabel={continuousNarrationButtonLabel}
        onContinuousNarrationToggle={() =>
          setIsContinuousStoryNarrationEnabled((currentValue) => !currentValue)
        }
        storyAudioStatusText={storyAudioStatusText}
        currentSceneTitle={currentScene?.title}
        sceneIndex={sceneIndex}
        sceneCount={enabledScenes.length}
      />
      <PublicExperienceShellGlobalStyles />
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
