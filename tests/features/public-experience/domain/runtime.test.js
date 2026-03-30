import { describe, expect, it } from "vitest";
import {
  buildAmbientParticleStyleVariables,
  buildExperienceShellState,
  resolveAmbientTheme,
  resolveExperienceAudio,
  selectEnabledScenes,
} from "../../../../features/public-experience/domain/runtime";

describe("public experience runtime helpers", () => {
  it("filters enabled scenes only", () => {
    expect(
      selectEnabledScenes({
        scenes: [
          { id: 1, enabled: true },
          { id: 2, enabled: false },
          { id: 3, enabled: true },
        ],
      })
    ).toEqual([
      { id: 1, enabled: true },
      { id: 3, enabled: true },
    ]);
  });

  it("resolves ambient themes from the universe name", () => {
    expect(resolveAmbientTheme("Farm Friends").mode).toBe("farm");
    expect(resolveAmbientTheme("Dream Night Parade").mode).toBe("night");
    expect(resolveAmbientTheme("")).toMatchObject({
      mode: "default",
      sizeScale: 1,
    });
  });

  it("builds scaled ambient particle style variables", () => {
    expect(
      buildAmbientParticleStyleVariables(
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
          sizeScale: 0.5,
          durationScale: 2,
          driftScale: 1.5,
          opacityScale: 2,
        }
      )
    ).toEqual({
      "--ambient-left": "8%",
      "--ambient-top": "12%",
      "--ambient-size": "14px",
      "--ambient-duration": "62s",
      "--ambient-delay": "-8s",
      "--ambient-drift-x": "15px",
      "--ambient-drift-y": "-108px",
      "--ambient-opacity": "0.48",
    });
  });

  it("resolves layered audio with page-level story narration preference", () => {
    expect(
      resolveExperienceAudio(
        {
          doll: {
            audio_urls: {
              ambient: { universe: " https://cdn.test/ambient.mp3 " },
              scene: {
                welcome: "https://cdn.test/welcome.mp3",
                story: "https://cdn.test/story-scene.mp3",
              },
              voice: {
                intro: "https://cdn.test/intro.mp3",
                story: "https://cdn.test/story-fallback.mp3",
                story_pages: ["", " https://cdn.test/page-2.mp3 "],
              },
            },
          },
        },
        1
      )
    ).toEqual({
      ambientAudioSrc: "https://cdn.test/ambient.mp3",
      welcomeSceneAudioSrc: "https://cdn.test/welcome.mp3",
      storySceneAudioSrc: "https://cdn.test/story-scene.mp3",
      introAudioSrc: "https://cdn.test/intro.mp3",
      storyAudioSrc: "https://cdn.test/page-2.mp3",
      storyAudioSourceType: "page",
    });
  });

  it("falls back to scene-level story narration when page narration is missing", () => {
    expect(
      resolveExperienceAudio(
        {
          audioUrls: {
            story: "https://cdn.test/story.mp3",
          },
        },
        0
      )
    ).toMatchObject({
      storyAudioSrc: "https://cdn.test/story.mp3",
      storyAudioSourceType: "fallback",
    });
  });

  it("builds welcome-scene labels and ambient suppression state", () => {
    expect(
      buildExperienceShellState({
        enabledScenes: [{ id: "welcome", type: "welcome", title: "Welcome" }],
        sceneIndex: 0,
        ambientAudioSrc: "https://cdn.test/ambient.mp3",
        introAudioSrc: "https://cdn.test/intro.mp3",
        isAmbientAudioEnabled: true,
        isAmbientAudioPlaying: true,
        isIntroAudioPlaying: true,
      })
    ).toMatchObject({
      currentScene: { id: "welcome", type: "welcome", title: "Welcome" },
      isFirstScene: true,
      isLastScene: true,
      isWelcomeScene: true,
      isStoryScene: false,
      shouldSuppressAmbientForVoice: true,
      audioButtonLabel: "Pause intro audio",
      audioButtonText: "Pause Intro",
      ambientButtonLabel: "Ambient On",
    });
  });

  it("builds story-scene fallback narration labels", () => {
    expect(
      buildExperienceShellState({
        enabledScenes: [{ id: "story", type: "story", title: "Story" }],
        sceneIndex: 0,
        storyAudioSrc: "https://cdn.test/story.mp3",
        storyAudioSourceType: "fallback",
        isContinuousStoryNarrationEnabled: true,
        storyPageIndex: 1,
      })
    ).toMatchObject({
      isStoryScene: true,
      audioButtonLabel: "Play story audio",
      audioButtonText: "Play Story",
      continuousNarrationButtonLabel: "Continuous Narration: On",
      storyAudioStatusText: "Scene narration fallback ready",
    });
  });
});
