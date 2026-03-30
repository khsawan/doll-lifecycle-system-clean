import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminCatalogDataController", () => ({
  useAdminCatalogDataController: vi.fn(),
}));

vi.mock(
  "../../../../features/admin/hooks/useAdminWorkspaceFilterSelectionController",
  () => ({
    useAdminWorkspaceFilterSelectionController: vi.fn(),
  })
);

vi.mock("../../../../features/admin/hooks/useAdminDetailDataController", () => ({
  useAdminDetailDataController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminPublicLinkController", () => ({
  useAdminPublicLinkController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminWorkspaceViewInputController", () => ({
  useAdminWorkspaceViewInputController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminWorkspaceViewStateController", () => ({
  useAdminWorkspaceViewStateController: vi.fn(),
}));

import { useAdminCatalogDataController } from "../../../../features/admin/hooks/useAdminCatalogDataController";
import { useAdminCatalogWorkspaceController } from "../../../../features/admin/hooks/useAdminCatalogWorkspaceController";
import { useAdminDetailDataController } from "../../../../features/admin/hooks/useAdminDetailDataController";
import { useAdminDetailWorkspaceController } from "../../../../features/admin/hooks/useAdminDetailWorkspaceController";
import { useAdminPublicLinkController } from "../../../../features/admin/hooks/useAdminPublicLinkController";
import { useAdminWorkspaceFilterSelectionController } from "../../../../features/admin/hooks/useAdminWorkspaceFilterSelectionController";
import { useAdminWorkspaceViewController } from "../../../../features/admin/hooks/useAdminWorkspaceViewController";
import { useAdminWorkspaceViewInputController } from "../../../../features/admin/hooks/useAdminWorkspaceViewInputController";
import { useAdminWorkspaceViewStateController } from "../../../../features/admin/hooks/useAdminWorkspaceViewStateController";

function CatalogHookProbe({ onValue, setError, setNotice }) {
  onValue(
    useAdminCatalogWorkspaceController({
      authChecked: true,
      isAuthenticated: true,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function DetailHookProbe({ onValue, catalogWorkspaceState, setError }) {
  onValue(
    useAdminDetailWorkspaceController({
      authChecked: true,
      isAuthenticated: false,
      catalogWorkspaceState,
      setError,
    })
  );

  return createElement("div", null, "probe");
}

function WorkspaceViewHookProbe({
  onValue,
  catalogWorkspaceState,
  detailWorkspaceState,
}) {
  onValue(
    useAdminWorkspaceViewController({
      catalogWorkspaceState,
      detailWorkspaceState,
      error: "Existing error",
      notice: "Saved changes",
    })
  );

  return createElement("div", null, "probe");
}

describe("selected workspace controller slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the catalog workspace controller", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const catalogDataControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
      },
      managedContentStoreState: {
        selectedContentManagement: { generation_status: "draft" },
      },
    };
    const workspaceFilterSelectionControllerState = {
      selectionState: {
        selectedWorkspaceMode: "dashboard",
      },
      operationsFilter: "all",
      setOperationsFilter: vi.fn(),
      operationsSort: "urgency",
      setOperationsSort: vi.fn(),
    };

    useAdminCatalogDataController.mockReturnValue(catalogDataControllerState);
    useAdminWorkspaceFilterSelectionController.mockReturnValue(
      workspaceFilterSelectionControllerState
    );

    let result;
    renderToStaticMarkup(
      createElement(CatalogHookProbe, {
        onValue: (value) => {
          result = value;
        },
        setError,
        setNotice,
      })
    );

    expect(useAdminCatalogDataController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: true,
      setError,
      setNotice,
    });
    expect(useAdminWorkspaceFilterSelectionController).toHaveBeenCalledWith({
      catalogDataControllerState,
    });
    expect(result).toEqual({
      ...catalogDataControllerState,
      ...workspaceFilterSelectionControllerState,
    });
  });

  it("wires the detail workspace controller", () => {
    const setError = vi.fn();
    const catalogWorkspaceState = {
      catalogState: {
        selected: { id: "doll-1" },
        dolls: [{ id: "doll-1" }],
      },
      managedContentStoreState: {
        generatedV1ContentByDoll: { "doll-1": { intro_script: "Hello" } },
      },
    };
    const detailDataControllerState = {
      detailState: {
        identity: { name: "Rosie" },
      },
    };
    const publicLinkControllerState = {
      publicLinkState: {
        selectedSlug: "rosie",
      },
    };

    useAdminDetailDataController.mockReturnValue(detailDataControllerState);
    useAdminPublicLinkController.mockReturnValue(publicLinkControllerState);

    let result;
    renderToStaticMarkup(
      createElement(DetailHookProbe, {
        onValue: (value) => {
          result = value;
        },
        catalogWorkspaceState,
        setError,
      })
    );

    expect(useAdminDetailDataController).toHaveBeenCalledWith({
      authChecked: true,
      isAuthenticated: false,
      catalogWorkspaceState,
      setError,
    });
    expect(useAdminPublicLinkController).toHaveBeenCalledWith({
      catalogWorkspaceState,
      detailDataControllerState,
    });
    expect(result).toEqual({
      ...detailDataControllerState,
      ...publicLinkControllerState,
    });
  });

  it("wires the workspace view controller", () => {
    const catalogWorkspaceState = {
      catalogState: {
        selected: { id: "doll-1" },
        dolls: [{ id: "doll-1" }],
      },
      managedContentStoreState: {
        contentManagementByDoll: { "doll-1": { generation_status: "draft" } },
        selectedContentManagement: { generation_status: "draft" },
        selectedGeneratedV1Content: { intro_script: "Hello" },
      },
      selectionState: {
        activeDepartment: "Overview",
        activeStageView: "overview",
        selectedWorkspaceMode: "dashboard",
      },
      operationsFilter: "all",
      operationsSort: "urgency",
    };
    const detailWorkspaceState = {
      detailState: {
        identity: { name: "Rosie" },
        story: { teaser: "Hello" },
        contentPack: { caption: "Caption" },
        order: { sales_status: "not_sold" },
        qrDataUrl: "data:image/png;base64,abc",
      },
      publicLinkState: {
        selectedSlug: "rosie",
        publicPath: "/doll/rosie",
        publicUrl: "https://example.com/doll/rosie",
        savedSlug: "rosie",
        legacyLockedSlug: "",
      },
    };
    const workspaceViewInputControllerState = {
      workspaceViewInput: {
        selected: catalogWorkspaceState.catalogState.selected,
      },
    };
    const workspaceViewStateControllerState = {
      workspaceViewState: {
        selectedReadiness: { ready: true },
      },
    };

    useAdminWorkspaceViewInputController.mockReturnValue(
      workspaceViewInputControllerState
    );
    useAdminWorkspaceViewStateController.mockReturnValue(
      workspaceViewStateControllerState
    );

    let result;
    renderToStaticMarkup(
      createElement(WorkspaceViewHookProbe, {
        onValue: (value) => {
          result = value;
        },
        catalogWorkspaceState,
        detailWorkspaceState,
      })
    );

    expect(useAdminWorkspaceViewInputController).toHaveBeenCalledWith({
      catalogWorkspaceState,
      detailWorkspaceState,
      error: "Existing error",
      notice: "Saved changes",
    });
    expect(useAdminWorkspaceViewStateController).toHaveBeenCalledWith({
      workspaceViewInputControllerState,
    });
    expect(result).toEqual({
      ...workspaceViewStateControllerState,
    });
  });
});
