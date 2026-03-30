import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminCommerceEditor", () => ({
  useAdminCommerceEditor: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminManagedContent", () => ({
  useAdminManagedContent: vi.fn(),
}));

import { useAdminCommerceEditor } from "../../../../features/admin/hooks/useAdminCommerceEditor";
import { useAdminCommerceEditorController } from "../../../../features/admin/hooks/useAdminCommerceEditorController";
import { useAdminManagedContent } from "../../../../features/admin/hooks/useAdminManagedContent";
import { useAdminManagedContentController } from "../../../../features/admin/hooks/useAdminManagedContentController";

function CommerceHookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminCommerceEditorController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function ManagedContentHookProbe({
  onValue,
  workspaceControllerState,
  setError,
  setNotice,
}) {
  onValue(
    useAdminManagedContentController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("managed content commerce controller slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the commerce editor controller", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        setDolls: vi.fn(),
      },
      detailState: {
        commerceStatus: "draft",
        order: { order_status: "pending" },
        setCommerceStatus: vi.fn(),
      },
      workspaceViewState: {
        selectedReadiness: { overall: true },
        effectiveSalesStatus: "available",
        saleTransitionReadinessMessage: "Everything is ready.",
      },
    };
    const commerceEditorState = { saveOrder: vi.fn() };

    useAdminCommerceEditor.mockReturnValue(commerceEditorState);

    let result;
    renderToStaticMarkup(
      createElement(CommerceHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminCommerceEditor).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      selectedReadiness: workspaceControllerState.workspaceViewState.selectedReadiness,
      effectiveSalesStatus:
        workspaceControllerState.workspaceViewState.effectiveSalesStatus,
      commerceStatus: workspaceControllerState.detailState.commerceStatus,
      order: workspaceControllerState.detailState.order,
      saleTransitionReadinessMessage:
        workspaceControllerState.workspaceViewState.saleTransitionReadinessMessage,
      setCommerceStatus: workspaceControllerState.detailState.setCommerceStatus,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      commerceEditorState,
    });
  });

  it("wires the managed-content controller", () => {
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
        setStory: vi.fn(),
        setPlayActivity: vi.fn(),
      },
      managedContentStoreState: {
        selectedContentManagement: { generation_status: "draft" },
        selectedGeneratedV1Content: { intro_script: "Hello" },
        updateSelectedContentManagement: vi.fn(),
        setGeneratedV1ContentByDoll: vi.fn(),
      },
      workspaceViewState: {
        contentPreviewHref: "/doll/rosie",
      },
    };
    const managedContentState = { generateDraft: vi.fn() };

    useAdminManagedContent.mockReturnValue(managedContentState);

    let result;
    renderToStaticMarkup(
      createElement(ManagedContentHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminManagedContent).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      identity: workspaceControllerState.detailState.identity,
      selectedContentManagement:
        workspaceControllerState.managedContentStoreState.selectedContentManagement,
      selectedGeneratedV1Content:
        workspaceControllerState.managedContentStoreState.selectedGeneratedV1Content,
      contentPreviewHref: workspaceControllerState.workspaceViewState.contentPreviewHref,
      updateSelectedContentManagement:
        workspaceControllerState.managedContentStoreState.updateSelectedContentManagement,
      setGeneratedV1ContentByDoll:
        workspaceControllerState.managedContentStoreState.setGeneratedV1ContentByDoll,
      setIdentity: workspaceControllerState.detailState.setIdentity,
      setStory: workspaceControllerState.detailState.setStory,
      setPlayActivity: workspaceControllerState.detailState.setPlayActivity,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      managedContentState,
    });
  });
});
