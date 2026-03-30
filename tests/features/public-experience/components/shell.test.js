import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PublicExperienceSceneNavigation from "../../../../features/public-experience/components/PublicExperienceSceneNavigation";
import PublicExperienceSceneViewport from "../../../../features/public-experience/components/PublicExperienceSceneViewport";
import PublicExperienceStateScreen from "../../../../features/public-experience/components/PublicExperienceStateScreen";
import PublicExperienceTopBar from "../../../../features/public-experience/components/PublicExperienceTopBar";
import { resolveAmbientTheme } from "../../../../features/public-experience/domain/runtime";

describe("public experience shell components", () => {
  it("renders state screens for loading and error flows", () => {
    const loadingMarkup = renderToStaticMarkup(
      createElement(PublicExperienceStateScreen, {
        message: "Loading doll story...",
      })
    );
    const errorMarkup = renderToStaticMarkup(
      createElement(PublicExperienceStateScreen, {
        title: "Doll page unavailable",
        message: "We could not load this doll page right now.",
        tone: "error",
      })
    );

    expect(loadingMarkup).toContain("Loading doll story...");
    expect(errorMarkup).toContain("Doll page unavailable");
    expect(errorMarkup).toContain("We could not load this doll page right now.");
  });

  it("renders the top bar with active story controls and scene metadata", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicExperienceTopBar, {
        ambientAudioSrc: "https://cdn.test/ambient.mp3",
        isAmbientAudioEnabled: true,
        ambientButtonLabel: "Ambient On",
        onAmbientToggle: () => {},
        isWelcomeScene: false,
        welcomeSceneAudioSrc: "",
        welcomeSceneAudioButtonLabel: "Play welcome scene audio",
        isWelcomeSceneAudioPlaying: false,
        onWelcomeSceneAudioToggle: () => {},
        audioButtonLabel: "Play story audio",
        audioButtonText: "Play Story",
        onAudioButtonClick: () => {},
        isStoryScene: true,
        storySceneAudioSrc: "https://cdn.test/story-scene.mp3",
        storySceneAudioButtonLabel: "Play story scene audio",
        isStorySceneAudioPlaying: false,
        onStorySceneAudioToggle: () => {},
        isContinuousStoryNarrationEnabled: true,
        continuousNarrationButtonLabel: "Continuous Narration: On",
        onContinuousNarrationToggle: () => {},
        storyAudioStatusText: "Page 2 narration ready",
        currentSceneTitle: "Rosie",
        sceneIndex: 1,
        sceneCount: 3,
      })
    );

    expect(markup).toContain("MAILLE &amp; MERVEILLE");
    expect(markup).toContain("Ambient On");
    expect(markup).toContain("Play Story");
    expect(markup).toContain("Continuous Narration: On");
    expect(markup).toContain("Page 2 narration ready");
    expect(markup).toContain("Rosie 2/3");
  });

  it("renders scene navigation tap zones and scene dots", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicExperienceSceneNavigation, {
        goPrevious: () => {},
        goNext: () => {},
        isTransitioning: false,
        isFirstScene: false,
        isLastScene: false,
        enabledScenes: [
          { id: "intro", title: "Intro" },
          { id: "story", title: "Story" },
          { id: "friends", title: "Friends" },
        ],
        sceneIndex: 1,
        onSceneSelect: () => {},
      })
    );

    expect(markup).toContain("Previous scene");
    expect(markup).toContain("Next scene");
    expect(markup).toContain("Previous");
    expect(markup).toContain("Next");
    expect(markup).toContain("Go to Intro");
    expect(markup).toContain("Go to Story");
    expect(markup).toContain("Go to Friends");
    expect(markup).toContain("top:88px");
    expect(markup).toContain("bottom:110px");
    expect(markup).toContain("width:clamp(72px, 14vw, 120px)");
  });

  it("renders the scene viewport and forwards current scene render state", () => {
    const markup = renderToStaticMarkup(
      createElement(
        PublicExperienceSceneViewport,
        {
          ambientTheme: resolveAmbientTheme("Forest Friends"),
          currentScene: { id: "scene-2", type: "story", title: "Forest Story" },
          sceneIndex: 1,
          isSceneVisible: true,
          isTransitioning: false,
          transitionMs: 300,
        },
        ({ currentScene, isSceneActive }) =>
          createElement(
            "div",
            null,
            `${currentScene?.title} / ${isSceneActive ? "active" : "inactive"}`
          )
      )
    );

    expect(markup).toContain("Forest Story / active");
    expect(markup).toContain("data-scene-type=\"story\"");
    expect(markup).toContain("shellAmbientParticle");
  });
});
