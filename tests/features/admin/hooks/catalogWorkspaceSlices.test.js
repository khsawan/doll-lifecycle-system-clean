import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminCatalog", () => ({
  useAdminCatalog: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminManagedContentState", () => ({
  useAdminManagedContentState: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminWorkspaceSelection", () => ({
  useAdminWorkspaceSelection: vi.fn(),
}));

import { useAdminCatalog } from "../../../../features/admin/hooks/useAdminCatalog";
import { useAdminCatalogDataController } from "../../../../features/admin/hooks/useAdminCatalogDataController";
import { useAdminManagedContentState } from "../../../../features/admin/hooks/useAdminManagedContentState";
import { useAdminWorkspaceFilterSelectionController } from "../../../../features/admin/hooks/useAdminWorkspaceFilterSelectionController";
import { useAdminWorkspaceSelection } from "../../../../features/admin/hooks/useAdminWorkspaceSelection";

function CatalogDataHookProbe({ onValue, setError, setNotice }) {
  onValue(
    useAdminCatalogDataController({
      authChecked: true,
      isAuthenticated: true,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function WorkspaceFilterSelectionHookProbe({
  onValue,
  catalogDataControllerState,
}) {
  onValue(
    useAdminWorkspaceFilterSelectionController({
      catalogDataControllerState,
    })
  );

  return createElement("div", null, "probe");
}

describe("catalog workspace controller slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the catalog data controller", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const catalogState = {
      selected: { id: "doll-1" },
      setDolls: vi.fn(),
      setSelectedId: vi.fn(),
    };
    const managedContentStoreState = {
      selectedContentManagement: { generation_status: "draft" },
    };

    useAdminCatalog.mockReturnValue(catalogState);
    useAdminManagedContentState.mockReturnValue(managedContentStoreState);

    let result;
    renderToStaticMarkup(
      createElement(CatalogDataHookProbe, {
        onValue: (value) => {
          result = value;
        },
        setError,
        setNotice,
      })
    );

    expect(useAdminCatalog).toHaveBeenCalledWith({
      isEnabled: true,
      setError,
      setNotice,
    });
    expect(useAdminManagedContentState).toHaveBeenCalledWith({
      selected: catalogState.selected,
      setDolls: catalogState.setDolls,
      setError,
    });
    expect(result).toEqual({
      catalogState,
      managedContentStoreState,
    });
  });

  it("wires the workspace filter/selection controller", () => {
    const catalogDataControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        setSelectedId: vi.fn(),
      },
    };
    const selectionState = {
      selectedWorkspaceMode: "dashboard",
    };

    useAdminWorkspaceSelection.mockReturnValue(selectionState);

    let result;
    renderToStaticMarkup(
      createElement(WorkspaceFilterSelectionHookProbe, {
        onValue: (value) => {
          result = value;
        },
        catalogDataControllerState,
      })
    );

    expect(useAdminWorkspaceSelection).toHaveBeenCalledWith({
      currentSelectedId: "doll-1",
      setSelectedId: catalogDataControllerState.catalogState.setSelectedId,
    });
    expect(result).toEqual({
      selectionState,
      operationsFilter: "all",
      setOperationsFilter: expect.any(Function),
      operationsSort: "urgency",
      setOperationsSort: expect.any(Function),
    });
  });
});
