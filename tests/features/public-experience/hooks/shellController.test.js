import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "../../../../features/public-experience/hooks/usePublicExperienceAudioController",
  () => ({
    usePublicExperienceAudioController: vi.fn(),
  })
);

vi.mock(
  "../../../../features/public-experience/hooks/usePublicExperienceSceneController",
  () => ({
    usePublicExperienceSceneController: vi.fn(),
  })
);

import { usePublicExperienceAudioController } from "../../../../features/public-experience/hooks/usePublicExperienceAudioController";
import { usePublicExperienceSceneController } from "../../../../features/public-experience/hooks/usePublicExperienceSceneController";
import { usePublicExperienceShellController } from "../../../../features/public-experience/hooks/usePublicExperienceShellController";

function HookProbe({ onValue, experience }) {
  onValue(
    usePublicExperienceShellController({
      experience,
      transitionMs: 420,
    })
  );

  return createElement("div", null, "probe");
}

describe("public experience shell controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the scene and audio controllers into shell state", () => {
    const experience = {
      universe: {
        name: "Forest Friends",
      },
    };
    const sceneControllerState = {
      enabledScenes: [{ id: "welcome", type: "welcome" }],
      sceneIndex: 0,
      currentScenePreview: { id: "welcome", type: "welcome" },
      requestSceneChange: vi.fn(),
    };
    const audioControllerState = {
      currentScene: { id: "welcome", type: "welcome", title: "Welcome" },
      ambientAudioSrc: "https://cdn.test/ambient.mp3",
      handleSceneChangeStart: vi.fn(),
    };

    usePublicExperienceSceneController.mockReturnValue(sceneControllerState);
    usePublicExperienceAudioController.mockReturnValue(audioControllerState);

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        experience,
      })
    );

    expect(usePublicExperienceSceneController).toHaveBeenCalledWith({
      experience,
      transitionMs: 420,
      onBeforeSceneChange: expect.any(Function),
    });
    expect(usePublicExperienceAudioController).toHaveBeenCalledWith({
      experience,
      enabledScenes: sceneControllerState.enabledScenes,
      sceneIndex: sceneControllerState.sceneIndex,
      currentScenePreview: sceneControllerState.currentScenePreview,
    });
    expect(result).toEqual({
      transitionMs: 420,
      ...sceneControllerState,
      ...audioControllerState,
    });
  });
});
