import { describe, expect, it } from "vitest";
import {
  canRequestSceneChange,
  clampSceneIndex,
} from "../../../../features/public-experience/domain/navigation";

describe("public experience navigation helpers", () => {
  it("clamps scene indices into the available scene range", () => {
    expect(clampSceneIndex(-3, 4)).toBe(0);
    expect(clampSceneIndex(2, 4)).toBe(2);
    expect(clampSceneIndex(8, 4)).toBe(3);
  });

  it("falls back to zero when the scene count is unavailable", () => {
    expect(clampSceneIndex(3, 0)).toBe(0);
    expect(clampSceneIndex(3, -1)).toBe(0);
  });

  it("allows only valid scene changes inside the current range", () => {
    expect(
      canRequestSceneChange({
        isTransitioning: false,
        nextIndex: 1,
        sceneCount: 3,
        sceneIndex: 0,
      })
    ).toBe(true);
  });

  it("blocks scene changes that are invalid or already in progress", () => {
    expect(
      canRequestSceneChange({
        isTransitioning: true,
        nextIndex: 1,
        sceneCount: 3,
        sceneIndex: 0,
      })
    ).toBe(false);

    expect(
      canRequestSceneChange({
        isTransitioning: false,
        nextIndex: -1,
        sceneCount: 3,
        sceneIndex: 0,
      })
    ).toBe(false);

    expect(
      canRequestSceneChange({
        isTransitioning: false,
        nextIndex: 3,
        sceneCount: 3,
        sceneIndex: 0,
      })
    ).toBe(false);

    expect(
      canRequestSceneChange({
        isTransitioning: false,
        nextIndex: 1,
        sceneCount: 3,
        sceneIndex: 1,
      })
    ).toBe(false);
  });
});
