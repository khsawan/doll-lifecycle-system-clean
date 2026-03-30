import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminStoryEditor", () => ({
  useAdminStoryEditor: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminContentPackEditor", () => ({
  useAdminContentPackEditor: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminIdentityEditor", () => ({
  useAdminIdentityEditor: vi.fn(),
}));

import { useAdminContentPackContentController } from "../../../../features/admin/hooks/useAdminContentPackContentController";
import { useAdminIdentityEditor } from "../../../../features/admin/hooks/useAdminIdentityEditor";
import { useAdminSocialContentController } from "../../../../features/admin/hooks/useAdminSocialContentController";
import { useAdminStoryContentController } from "../../../../features/admin/hooks/useAdminStoryContentController";
import { useAdminStoryEditor } from "../../../../features/admin/hooks/useAdminStoryEditor";
import { useAdminContentPackEditor } from "../../../../features/admin/hooks/useAdminContentPackEditor";

function StoryHookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminStoryContentController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function ContentPackHookProbe({
  onValue,
  workspaceControllerState,
  setError,
  setNotice,
}) {
  onValue(
    useAdminContentPackContentController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function SocialHookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminSocialContentController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin content editor slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the story content controller with story tone state", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        setDolls: vi.fn(),
      },
      detailState: {
        identity: { name: "Rosie" },
        story: { teaser: "Hello" },
        setStory: vi.fn(),
        setSavedStorySnapshot: vi.fn(),
      },
    };
    const storyEditorState = { saveStory: vi.fn() };
    useAdminStoryEditor.mockReturnValue(storyEditorState);

    let result;
    renderToStaticMarkup(
      createElement(StoryHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminStoryEditor).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      identity: workspaceControllerState.detailState.identity,
      story: workspaceControllerState.detailState.story,
      setStoryTone: expect.any(Function),
      setStory: workspaceControllerState.detailState.setStory,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setSavedStorySnapshot:
        workspaceControllerState.detailState.setSavedStorySnapshot,
      setError,
      setNotice,
    });
    expect(result.storyTone).toBe("Gentle");
    expect(result.storyEditorState).toBe(storyEditorState);
  });

  it("wires the content-pack content controller", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        setDolls: vi.fn(),
      },
      detailState: {
        identity: { name: "Rosie" },
        contentPack: { caption: "Hi" },
        setContentPack: vi.fn(),
        setSavedContentPackSnapshot: vi.fn(),
      },
    };
    const contentPackEditorState = { saveContentPack: vi.fn() };
    useAdminContentPackEditor.mockReturnValue(contentPackEditorState);

    let result;
    renderToStaticMarkup(
      createElement(ContentPackHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminContentPackEditor).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      identity: workspaceControllerState.detailState.identity,
      contentPack: workspaceControllerState.detailState.contentPack,
      setContentPack: workspaceControllerState.detailState.setContentPack,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setSavedContentPackSnapshot:
        workspaceControllerState.detailState.setSavedContentPackSnapshot,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      contentPackEditorState,
    });
  });

  it("wires the social content controller with slug locking", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        setDolls: vi.fn(),
      },
      detailState: {
        identity: { name: "Rosie" },
        setIdentity: vi.fn(),
        setSavedSocialSnapshot: vi.fn(),
      },
      publicLinkState: {
        slugLocked: true,
      },
    };
    const identityEditorState = { saveIdentity: vi.fn() };
    useAdminIdentityEditor.mockReturnValue(identityEditorState);

    let result;
    renderToStaticMarkup(
      createElement(SocialHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminIdentityEditor).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      identity: workspaceControllerState.detailState.identity,
      slugLocked: true,
      setIdentity: workspaceControllerState.detailState.setIdentity,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setSavedSocialSnapshot:
        workspaceControllerState.detailState.setSavedSocialSnapshot,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      identityEditorState,
    });
  });
});
