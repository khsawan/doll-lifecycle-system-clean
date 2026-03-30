import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminContentPackContentController", () => ({
  useAdminContentPackContentController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminSocialContentController", () => ({
  useAdminSocialContentController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminStoryContentController", () => ({
  useAdminStoryContentController: vi.fn(),
}));

import { useAdminContentPackContentController } from "../../../../features/admin/hooks/useAdminContentPackContentController";
import { useAdminContentSliceController } from "../../../../features/admin/hooks/useAdminContentSliceController";
import { useAdminSocialContentController } from "../../../../features/admin/hooks/useAdminSocialContentController";
import { useAdminStoryContentController } from "../../../../features/admin/hooks/useAdminStoryContentController";

function HookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminContentSliceController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin content slice controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the story, content-pack, and social content controllers", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      detailState: {
        identity: { name: "Rosie" },
      },
    };
    const storyEditorState = { saveStory: vi.fn() };
    const contentPackEditorState = { saveContentPack: vi.fn() };
    const identityEditorState = { saveIdentity: vi.fn() };

    useAdminStoryContentController.mockReturnValue({
      storyTone: "Gentle",
      setStoryTone: vi.fn(),
      storyEditorState,
    });
    useAdminContentPackContentController.mockReturnValue({
      contentPackEditorState,
    });
    useAdminSocialContentController.mockReturnValue({
      identityEditorState,
    });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminStoryContentController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(useAdminContentPackContentController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(useAdminSocialContentController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      storyTone: "Gentle",
      setStoryTone: expect.any(Function),
      storyEditorState,
      contentPackEditorState,
      identityEditorState,
    });
  });
});
