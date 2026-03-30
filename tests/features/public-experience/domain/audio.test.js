import { describe, expect, it } from "vitest";
import {
  shouldAutoplayStoryNarration,
  shouldPlayAmbientAudio,
} from "../../../../features/public-experience/domain/audio";

describe("public experience audio helpers", () => {
  it("allows ambient playback only when audio is loaded, enabled, and not suppressed", () => {
    expect(
      shouldPlayAmbientAudio({
        hasAudioRef: true,
        ambientAudioSrc: "https://cdn.test/ambient.mp3",
        isAmbientAudioEnabled: true,
        shouldSuppressAmbientForVoice: false,
      })
    ).toBe(true);
  });

  it("blocks ambient playback when any required condition is missing", () => {
    expect(
      shouldPlayAmbientAudio({
        hasAudioRef: false,
        ambientAudioSrc: "https://cdn.test/ambient.mp3",
        isAmbientAudioEnabled: true,
      })
    ).toBe(false);

    expect(
      shouldPlayAmbientAudio({
        hasAudioRef: true,
        ambientAudioSrc: "",
        isAmbientAudioEnabled: true,
      })
    ).toBe(false);

    expect(
      shouldPlayAmbientAudio({
        hasAudioRef: true,
        ambientAudioSrc: "https://cdn.test/ambient.mp3",
        isAmbientAudioEnabled: false,
      })
    ).toBe(false);

    expect(
      shouldPlayAmbientAudio({
        hasAudioRef: true,
        ambientAudioSrc: "https://cdn.test/ambient.mp3",
        isAmbientAudioEnabled: true,
        shouldSuppressAmbientForVoice: true,
      })
    ).toBe(false);
  });

  it("autoplays story narration only when the page changed inside an active story session", () => {
    expect(
      shouldAutoplayStoryNarration({
        hasStoryAudioRef: true,
        isStoryScene: true,
        isContinuousStoryNarrationEnabled: true,
        isStoryPlaybackSessionActive: true,
        storyAudioSrc: "https://cdn.test/story-page.mp3",
        storyPageIndex: 2,
        previousStoryPageIndex: 1,
      })
    ).toBe(true);
  });

  it("blocks story narration autoplay when the story session is inactive or the page did not change", () => {
    expect(
      shouldAutoplayStoryNarration({
        hasStoryAudioRef: false,
        isStoryScene: true,
        isContinuousStoryNarrationEnabled: true,
        isStoryPlaybackSessionActive: true,
        storyAudioSrc: "https://cdn.test/story-page.mp3",
        storyPageIndex: 2,
        previousStoryPageIndex: 1,
      })
    ).toBe(false);

    expect(
      shouldAutoplayStoryNarration({
        hasStoryAudioRef: true,
        isStoryScene: true,
        isContinuousStoryNarrationEnabled: true,
        isStoryPlaybackSessionActive: false,
        storyAudioSrc: "https://cdn.test/story-page.mp3",
        storyPageIndex: 2,
        previousStoryPageIndex: 1,
      })
    ).toBe(false);

    expect(
      shouldAutoplayStoryNarration({
        hasStoryAudioRef: true,
        isStoryScene: true,
        isContinuousStoryNarrationEnabled: true,
        isStoryPlaybackSessionActive: true,
        storyAudioSrc: "https://cdn.test/story-page.mp3",
        storyPageIndex: 2,
        previousStoryPageIndex: 2,
      })
    ).toBe(false);
  });
});
