import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminCommerceEditorController", () => ({
  useAdminCommerceEditorController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminManagedContentController", () => ({
  useAdminManagedContentController: vi.fn(),
}));

import { useAdminCommerceEditorController } from "../../../../features/admin/hooks/useAdminCommerceEditorController";
import { useAdminManagedContentCommerceController } from "../../../../features/admin/hooks/useAdminManagedContentCommerceController";
import { useAdminManagedContentController } from "../../../../features/admin/hooks/useAdminManagedContentController";

function HookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminManagedContentCommerceController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("managed content commerce controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the commerce and managed-content controllers", () => {
    const workspaceControllerState = {
      catalogState: { selected: { id: "doll-1" } },
    };
    const setError = vi.fn();
    const setNotice = vi.fn();
    const commerceControllerState = {
      commerceEditorState: { saveOrder: vi.fn() },
    };
    const managedContentControllerState = {
      managedContentState: { generateDraft: vi.fn() },
    };

    useAdminCommerceEditorController.mockReturnValue(commerceControllerState);
    useAdminManagedContentController.mockReturnValue(managedContentControllerState);

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

    expect(useAdminCommerceEditorController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(useAdminManagedContentController).toHaveBeenCalledWith({
      workspaceControllerState,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      ...commerceControllerState,
      ...managedContentControllerState,
    });
  });
});
