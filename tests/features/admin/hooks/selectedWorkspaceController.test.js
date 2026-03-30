import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminCatalogWorkspaceController", () => ({
  useAdminCatalogWorkspaceController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminDetailWorkspaceController", () => ({
  useAdminDetailWorkspaceController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminWorkspaceViewController", () => ({
  useAdminWorkspaceViewController: vi.fn(),
}));

import { useAdminCatalogWorkspaceController } from "../../../../features/admin/hooks/useAdminCatalogWorkspaceController";
import { useAdminDetailWorkspaceController } from "../../../../features/admin/hooks/useAdminDetailWorkspaceController";
import { useAdminSelectedWorkspaceController } from "../../../../features/admin/hooks/useAdminSelectedWorkspaceController";
import { useAdminWorkspaceViewController } from "../../../../features/admin/hooks/useAdminWorkspaceViewController";

function HookProbe({ onValue, setError, setNotice }) {
  onValue(
    useAdminSelectedWorkspaceController({
      authChecked: true,
      isAuthenticated: true,
      error: "Existing error",
      notice: "Saved changes",
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("selected workspace controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes the catalog, detail, and workspace-view controllers", () => {
    const catalogWorkspaceState = {
      catalogState: { selected: { id: "doll-1" } },
      managedContentStoreState: { selectedContentManagement: {} },
      selectionState: { selectedWorkspaceMode: "dashboard" },
      operationsFilter: "all",
      setOperationsFilter: vi.fn(),
      operationsSort: "urgency",
      setOperationsSort: vi.fn(),
    };
    const detailWorkspaceState = {
      detailState: { identity: { name: "Rosie" } },
      publicLinkState: { publicUrl: "https://example.com/doll/rosie" },
    };
    const workspaceViewState = {
      selectedReadiness: { ready: true },
    };

    useAdminCatalogWorkspaceController.mockReturnValue(catalogWorkspaceState);
    useAdminDetailWorkspaceController.mockReturnValue(detailWorkspaceState);
    useAdminWorkspaceViewController.mockReturnValue({
      workspaceViewState,
    });

    let result;
    const setError = vi.fn();
    const setNotice = vi.fn();
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        setError,
        setNotice,
      })
    );

    expect(useAdminCatalogWorkspaceController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: true,
      setError,
      setNotice,
    });
    expect(useAdminDetailWorkspaceController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: true,
      catalogWorkspaceState,
      setError,
    });
    expect(useAdminWorkspaceViewController).toHaveBeenCalledWith({
      catalogWorkspaceState,
      detailWorkspaceState,
      error: "Existing error",
      notice: "Saved changes",
    });
    expect(result).toEqual({
      ...catalogWorkspaceState,
      ...detailWorkspaceState,
      workspaceViewState,
    });
  });
});
