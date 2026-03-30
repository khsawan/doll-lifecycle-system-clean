import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminContentEditorController", () => ({
  useAdminContentEditorController: vi.fn(),
}));

vi.mock(
  "../../../../features/admin/hooks/useAdminManagedContentCommerceController",
  () => ({
    useAdminManagedContentCommerceController: vi.fn(),
  })
);

import { useAdminContentEditorController } from "../../../../features/admin/hooks/useAdminContentEditorController";
import { useAdminEditorController } from "../../../../features/admin/hooks/useAdminEditorController";
import { useAdminManagedContentCommerceController } from "../../../../features/admin/hooks/useAdminManagedContentCommerceController";

function HookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminEditorController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin editor controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the content-editor and managed-content/commerce coordinators", () => {
    const workspaceControllerState = { catalogState: { selected: { id: "doll-1" } } };
    const setError = vi.fn();
    const setNotice = vi.fn();
    const contentEditorControllerState = {
      storyEditorState: { saveStory: vi.fn() },
      contentPackEditorState: { saveContentPack: vi.fn() },
      identityEditorState: { saveIdentity: vi.fn() },
      contentSectionState: { storySaveState: { label: "Saved" } },
    };
    const managedContentCommerceControllerState = {
      commerceEditorState: { saveOrder: vi.fn() },
      managedContentState: { generateDraft: vi.fn() },
    };

    useAdminContentEditorController.mockReturnValue(contentEditorControllerState);
    useAdminManagedContentCommerceController.mockReturnValue(
      managedContentCommerceControllerState
    );

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

    expect(useAdminContentEditorController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(useAdminManagedContentCommerceController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      ...contentEditorControllerState,
      ...managedContentCommerceControllerState,
    });
  });
});
