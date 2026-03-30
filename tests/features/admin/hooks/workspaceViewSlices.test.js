import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminWorkspaceView", () => ({
  useAdminWorkspaceView: vi.fn(),
}));

import { useAdminWorkspaceView } from "../../../../features/admin/hooks/useAdminWorkspaceView";
import { useAdminWorkspaceViewInputController } from "../../../../features/admin/hooks/useAdminWorkspaceViewInputController";
import { useAdminWorkspaceViewStateController } from "../../../../features/admin/hooks/useAdminWorkspaceViewStateController";

function WorkspaceViewInputHookProbe({
  onValue,
  catalogWorkspaceState,
  detailWorkspaceState,
}) {
  onValue(
    useAdminWorkspaceViewInputController({
      catalogWorkspaceState,
      detailWorkspaceState,
      error: "Existing error",
      notice: "Saved changes",
    })
  );

  return createElement("div", null, "probe");
}

function WorkspaceViewStateHookProbe({
  onValue,
  workspaceViewInputControllerState,
}) {
  onValue(
    useAdminWorkspaceViewStateController({
      workspaceViewInputControllerState,
    })
  );

  return createElement("div", null, "probe");
}

describe("workspace view controller slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembles the workspace view input", () => {
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

    let result;
    renderToStaticMarkup(
      createElement(WorkspaceViewInputHookProbe, {
        onValue: (value) => {
          result = value;
        },
        catalogWorkspaceState,
        detailWorkspaceState,
      })
    );

    expect(result).toEqual({
      workspaceViewInput: {
        selected: catalogWorkspaceState.catalogState.selected,
        identity: detailWorkspaceState.detailState.identity,
        story: detailWorkspaceState.detailState.story,
        contentPack: detailWorkspaceState.detailState.contentPack,
        order: detailWorkspaceState.detailState.order,
        qrDataUrl: detailWorkspaceState.detailState.qrDataUrl,
        dolls: catalogWorkspaceState.catalogState.dolls,
        contentManagementByDoll:
          catalogWorkspaceState.managedContentStoreState.contentManagementByDoll,
        selectedContentManagement:
          catalogWorkspaceState.managedContentStoreState.selectedContentManagement,
        selectedGeneratedV1Content:
          catalogWorkspaceState.managedContentStoreState.selectedGeneratedV1Content,
        activeDepartment: catalogWorkspaceState.selectionState.activeDepartment,
        activeStageView: catalogWorkspaceState.selectionState.activeStageView,
        selectedWorkspaceMode:
          catalogWorkspaceState.selectionState.selectedWorkspaceMode,
        operationsFilter: "all",
        operationsSort: "urgency",
        selectedSlug: detailWorkspaceState.publicLinkState.selectedSlug,
        publicPath: detailWorkspaceState.publicLinkState.publicPath,
        publicUrl: detailWorkspaceState.publicLinkState.publicUrl,
        savedSlug: detailWorkspaceState.publicLinkState.savedSlug,
        legacyLockedSlug: detailWorkspaceState.publicLinkState.legacyLockedSlug,
        error: "Existing error",
        notice: "Saved changes",
      },
    });
  });

  it("wires the workspace view state controller", () => {
    const workspaceViewInputControllerState = {
      workspaceViewInput: {
        selected: { id: "doll-1" },
      },
    };
    const workspaceViewState = {
      selectedReadiness: { ready: true },
    };

    useAdminWorkspaceView.mockReturnValue(workspaceViewState);

    let result;
    renderToStaticMarkup(
      createElement(WorkspaceViewStateHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceViewInputControllerState,
      })
    );

    expect(useAdminWorkspaceView).toHaveBeenCalledWith(
      workspaceViewInputControllerState.workspaceViewInput
    );
    expect(result).toEqual({
      workspaceViewState,
    });
  });
});
