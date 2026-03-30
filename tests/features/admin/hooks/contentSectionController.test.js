import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/domain/content", () => ({
  buildAdminContentSectionState: vi.fn(),
}));

import { buildAdminContentSectionState } from "../../../../features/admin/domain/content";
import { useAdminContentSectionController } from "../../../../features/admin/hooks/useAdminContentSectionController";

function HookProbe({
  onValue,
  workspaceControllerState,
  contentSliceControllerState,
}) {
  onValue(
    useAdminContentSectionController({
      workspaceControllerState,
      contentSliceControllerState,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin content section controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds content section state from workspace and slice state", () => {
    const workspaceControllerState = {
      detailState: {
        identity: { name: "Rosie" },
        story: { teaser: "Hello" },
        setStory: vi.fn(),
        savedStorySnapshot: { teaser: "Hello" },
        contentPack: { caption: "Hi" },
        setContentPack: vi.fn(),
        savedContentPackSnapshot: { caption: "Hi" },
        setIdentity: vi.fn(),
        savedSocialSnapshot: { social_hook: "Wave" },
      },
      workspaceViewState: {
        isContentEditable: true,
        hasStoryContent: true,
        hasContentAssets: false,
      },
    };
    const contentSliceControllerState = {
      storyTone: "Gentle",
      setStoryTone: vi.fn(),
      storyEditorState: {
        applyTone: vi.fn(),
        storyGenerating: false,
        saveStory: vi.fn(),
        storyVariations: [{ id: "story-1" }],
        selectedStoryVariationId: "story-1",
        applyStoryVariationToEditor: vi.fn(),
        setSelectedStoryVariationId: vi.fn(),
        storySaving: false,
      },
      contentPackEditorState: {
        generateContentPack: vi.fn(),
        contentPackGenerating: false,
        saveContentPack: vi.fn(),
        contentPackVariations: [{ id: "pack-1" }],
        selectedContentPackVariationId: "pack-1",
        applyContentPackVariationToEditor: vi.fn(),
        setSelectedContentPackVariationId: vi.fn(),
      },
      identityEditorState: {
        generateSocialContent: vi.fn(),
        socialGenerating: false,
        saveIdentity: vi.fn(),
        socialVariations: [{ id: "social-1" }],
        selectedSocialVariationId: "social-1",
        applySocialVariationToEditor: vi.fn(),
        setSelectedSocialVariationId: vi.fn(),
        socialSaving: false,
      },
    };

    buildAdminContentSectionState.mockReturnValue({ content: true });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        contentSliceControllerState,
      })
    );

    expect(buildAdminContentSectionState).toHaveBeenCalledWith(
      expect.objectContaining({
        isContentEditable: true,
        hasStoryContent: true,
        storyTone: "Gentle",
        applyTone: contentSliceControllerState.storyEditorState.applyTone,
        saveStory: contentSliceControllerState.storyEditorState.saveStory,
        generateContentPack:
          contentSliceControllerState.contentPackEditorState.generateContentPack,
        saveContentPack:
          contentSliceControllerState.contentPackEditorState.saveContentPack,
        generateSocialContent:
          contentSliceControllerState.identityEditorState.generateSocialContent,
        saveIdentity: contentSliceControllerState.identityEditorState.saveIdentity,
        hasContentAssets: false,
      })
    );
    expect(result).toEqual({
      contentSectionState: { content: true },
    });
  });
});
