import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/public-experience/domain/runtime", () => ({
  buildExperienceShellState: vi.fn(),
  resolveAmbientTheme: vi.fn(),
  resolveExperienceAudio: vi.fn(),
  selectEnabledScenes: vi.fn(),
}));

vi.mock("../../../../features/public-experience/hooks/usePublicAmbientAudio", () => ({
  default: vi.fn(),
}));

vi.mock("../../../../features/public-experience/hooks/usePublicAudioTrack", () => ({
  default: vi.fn(),
}));

vi.mock("../../../../features/public-experience/hooks/usePublicSceneNavigation", () => ({
  default: vi.fn(),
}));

vi.mock("../../../../features/public-experience/hooks/usePublicStoryNarration", () => ({
  default: vi.fn(),
}));

import {
  buildExperienceShellState,
  resolveAmbientTheme,
  resolveExperienceAudio,
  selectEnabledScenes,
} from "../../../../features/public-experience/domain/runtime";
import { usePublicExperienceAudioController } from "../../../../features/public-experience/hooks/usePublicExperienceAudioController";
import { usePublicExperienceSceneController } from "../../../../features/public-experience/hooks/usePublicExperienceSceneController";
import usePublicAmbientAudio from "../../../../features/public-experience/hooks/usePublicAmbientAudio";
import usePublicAudioTrack from "../../../../features/public-experience/hooks/usePublicAudioTrack";
import usePublicSceneNavigation from "../../../../features/public-experience/hooks/usePublicSceneNavigation";
import usePublicStoryNarration from "../../../../features/public-experience/hooks/usePublicStoryNarration";

function SceneHookProbe({ onValue, experience }) {
  onValue(
    usePublicExperienceSceneController({
      experience,
      transitionMs: 360,
      onBeforeSceneChange: () => {},
    })
  );

  return createElement("div", null, "probe");
}

function AudioHookProbe({ onValue, experience, enabledScenes, currentScenePreview }) {
  onValue(
    usePublicExperienceAudioController({
      experience,
      enabledScenes,
      sceneIndex: 1,
      currentScenePreview,
    })
  );

  return createElement("div", null, "probe");
}

describe("public experience shell slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the scene controller", () => {
    const experience = {
      universe: {
        name: "Forest Friends",
      },
    };
    const enabledScenes = [
      { id: "welcome", type: "welcome" },
      { id: "story", type: "story" },
    ];
    const navigationState = {
      sceneIndex: 1,
      isSceneVisible: true,
      isTransitioning: false,
      requestSceneChange: vi.fn(),
      goPrevious: vi.fn(),
      goNext: vi.fn(),
    };

    selectEnabledScenes.mockReturnValue(enabledScenes);
    resolveAmbientTheme.mockReturnValue({ mode: "forest" });
    usePublicSceneNavigation.mockReturnValue(navigationState);

    let result;
    renderToStaticMarkup(
      createElement(SceneHookProbe, {
        onValue: (value) => {
          result = value;
        },
        experience,
      })
    );

    expect(selectEnabledScenes).toHaveBeenCalledWith(experience);
    expect(resolveAmbientTheme).toHaveBeenCalledWith("Forest Friends");
    expect(usePublicSceneNavigation).toHaveBeenCalledWith({
      enabledSceneCount: enabledScenes.length,
      transitionMs: 360,
      onBeforeSceneChange: expect.any(Function),
    });
    expect(result).toEqual({
      enabledScenes,
      ambientTheme: { mode: "forest" },
      currentScenePreview: enabledScenes[1],
      ...navigationState,
    });
  });

  it("wires the audio controller through the extracted audio hooks", () => {
    const experience = {
      universe: {
        name: "Forest Friends",
      },
    };
    const enabledScenes = [
      { id: "welcome", type: "welcome" },
      { id: "story", type: "story" },
    ];
    const ambientAudioRef = { current: { pause: vi.fn(), currentTime: 0, play: vi.fn() } };
    const introAudioRef = { current: { pause: vi.fn(), currentTime: 0, play: vi.fn() } };
    const welcomeSceneAudioRef = {
      current: { pause: vi.fn(), currentTime: 0, play: vi.fn(), paused: true, ended: false },
    };
    const storySceneAudioRef = {
      current: { pause: vi.fn(), currentTime: 0, play: vi.fn(), paused: true, ended: false },
    };
    const storyAudioRef = {
      current: { pause: vi.fn(), currentTime: 0, play: vi.fn(), paused: true, ended: false },
    };

    resolveExperienceAudio.mockReturnValue({
      ambientAudioSrc: "https://cdn.test/ambient.mp3",
      welcomeSceneAudioSrc: "https://cdn.test/welcome.mp3",
      storySceneAudioSrc: "https://cdn.test/story-scene.mp3",
      introAudioSrc: "https://cdn.test/intro.mp3",
      storyAudioSrc: "https://cdn.test/story.mp3",
      storyAudioSourceType: "page",
    });
    buildExperienceShellState.mockReturnValue({
      currentScene: { id: "story", type: "story", title: "Story" },
      isFirstScene: false,
      isLastScene: true,
      isWelcomeScene: false,
      isStoryScene: true,
      shouldSuppressAmbientForVoice: false,
      audioButtonLabel: "Play story audio",
      audioButtonText: "Play Story",
      ambientButtonLabel: "Ambient Off",
      welcomeSceneAudioButtonLabel: "Play welcome scene audio",
      storySceneAudioButtonLabel: "Play story scene audio",
      continuousNarrationButtonLabel: "Continuous Narration: Off",
      storyAudioStatusText: "Page 1 narration ready",
    });
    usePublicAudioTrack
      .mockReturnValueOnce({
        audioRef: ambientAudioRef,
        isPlaying: false,
      })
      .mockReturnValueOnce({
        audioRef: introAudioRef,
        isPlaying: false,
      })
      .mockReturnValueOnce({
        audioRef: welcomeSceneAudioRef,
        isPlaying: false,
      })
      .mockReturnValueOnce({
        audioRef: storySceneAudioRef,
        isPlaying: false,
      })
      .mockReturnValueOnce({
        audioRef: storyAudioRef,
        isPlaying: false,
      });

    let result;
    renderToStaticMarkup(
      createElement(AudioHookProbe, {
        onValue: (value) => {
          result = value;
        },
        experience,
        enabledScenes,
        currentScenePreview: enabledScenes[1],
      })
    );

    expect(resolveExperienceAudio).toHaveBeenCalledWith(experience, 0);
    expect(buildExperienceShellState).toHaveBeenCalledWith({
      enabledScenes,
      sceneIndex: 1,
      ambientAudioSrc: "https://cdn.test/ambient.mp3",
      introAudioSrc: "https://cdn.test/intro.mp3",
      storyAudioSrc: "https://cdn.test/story.mp3",
      storyAudioSourceType: "page",
      isAmbientAudioEnabled: false,
      isAmbientAudioPlaying: false,
      isWelcomeSceneAudioPlaying: false,
      isStorySceneAudioPlaying: false,
      isIntroAudioPlaying: false,
      isStoryAudioPlaying: false,
      isContinuousStoryNarrationEnabled: false,
      isStoryPlaybackSessionActive: false,
      storyPageIndex: 0,
    });
    expect(usePublicAmbientAudio).toHaveBeenCalledWith({
      audioRef: ambientAudioRef,
      ambientAudioSrc: "https://cdn.test/ambient.mp3",
      isAmbientAudioEnabled: false,
      shouldSuppressAmbientForVoice: false,
    });
    expect(usePublicStoryNarration).toHaveBeenCalledWith({
      ambientAudioRef,
      storyAudioRef,
      isStoryScene: true,
      isContinuousStoryNarrationEnabled: false,
      isStoryPlaybackSessionActive: false,
      setIsStoryPlaybackSessionActive: expect.any(Function),
      storyAudioSrc: "https://cdn.test/story.mp3",
      storyPageIndex: 0,
    });
    expect(result).toMatchObject({
      currentScene: { id: "story", type: "story", title: "Story" },
      ambientAudioSrc: "https://cdn.test/ambient.mp3",
      welcomeSceneAudioSrc: "https://cdn.test/welcome.mp3",
      storySceneAudioSrc: "https://cdn.test/story-scene.mp3",
      ambientButtonLabel: "Ambient Off",
      storyAudioStatusText: "Page 1 narration ready",
      setStoryPageIndex: expect.any(Function),
      handleAmbientToggleClick: expect.any(Function),
      handleWelcomeSceneAudioButtonClick: expect.any(Function),
      handleStorySceneAudioButtonClick: expect.any(Function),
      handleAudioButtonClick: expect.any(Function),
      handleSceneChangeStart: expect.any(Function),
    });
  });
});
