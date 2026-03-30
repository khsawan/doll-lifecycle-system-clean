import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminContentSectionController", () => ({
  useAdminContentSectionController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminContentSliceController", () => ({
  useAdminContentSliceController: vi.fn(),
}));

import { useAdminContentEditorController } from "../../../../features/admin/hooks/useAdminContentEditorController";
import { useAdminContentSectionController } from "../../../../features/admin/hooks/useAdminContentSectionController";
import { useAdminContentSliceController } from "../../../../features/admin/hooks/useAdminContentSliceController";

function HookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminContentEditorController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin content editor controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the content-slice and content-section controllers", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = { detailState: { identity: { name: "Rosie" } } };
    const contentSliceControllerState = {
      storyTone: "Gentle",
      setStoryTone: vi.fn(),
      storyEditorState: {
        applyTone: vi.fn(),
        saveStory: vi.fn(),
      },
      contentPackEditorState: {
        generateContentPack: vi.fn(),
        saveContentPack: vi.fn(),
      },
      identityEditorState: {
        generateSocialContent: vi.fn(),
        saveIdentity: vi.fn(),
      },
    };
    const contentSectionControllerState = {
      contentSectionState: { content: true },
    };
    const storyEditorState = {
      applyTone: vi.fn(),
      storyGenerating: false,
      saveStory: vi.fn(),
      storyVariations: [{ id: "story-1" }],
      selectedStoryVariationId: "story-1",
      applyStoryVariationToEditor: vi.fn(),
      setSelectedStoryVariationId: vi.fn(),
      storySaving: false,
    };
    const contentPackEditorState = {
      generateContentPack: vi.fn(),
      contentPackGenerating: false,
      saveContentPack: vi.fn(),
      contentPackVariations: [{ id: "pack-1" }],
      selectedContentPackVariationId: "pack-1",
      applyContentPackVariationToEditor: vi.fn(),
      setSelectedContentPackVariationId: vi.fn(),
    };
    const identityEditorState = {
      generateSocialContent: vi.fn(),
      socialGenerating: false,
      saveIdentity: vi.fn(),
      socialVariations: [{ id: "social-1" }],
      selectedSocialVariationId: "social-1",
      applySocialVariationToEditor: vi.fn(),
      setSelectedSocialVariationId: vi.fn(),
      socialSaving: false,
    };

    useAdminContentSliceController.mockReturnValue({
      ...contentSliceControllerState,
      storyEditorState,
      contentPackEditorState,
      identityEditorState,
    });
    useAdminContentSectionController.mockReturnValue(contentSectionControllerState);

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

    expect(useAdminContentSliceController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(useAdminContentSectionController).toHaveBeenCalledWith({
      workspaceControllerState,
      contentSliceControllerState: {
        ...contentSliceControllerState,
        storyEditorState,
        contentPackEditorState,
        identityEditorState,
      },
    });
    expect(result).toEqual({
      storyEditorState,
      contentPackEditorState,
      identityEditorState,
      contentSectionState: { content: true },
    });
  });
});
