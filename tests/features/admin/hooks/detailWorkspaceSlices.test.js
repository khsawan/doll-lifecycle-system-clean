import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminDetailState", () => ({
  useAdminDetailState: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminPublicLinkState", () => ({
  useAdminPublicLinkState: vi.fn(),
}));

import { useAdminDetailDataController } from "../../../../features/admin/hooks/useAdminDetailDataController";
import { useAdminDetailState } from "../../../../features/admin/hooks/useAdminDetailState";
import { useAdminPublicLinkController } from "../../../../features/admin/hooks/useAdminPublicLinkController";
import { useAdminPublicLinkState } from "../../../../features/admin/hooks/useAdminPublicLinkState";

function DetailDataHookProbe({
  onValue,
  catalogWorkspaceState,
  setError,
}) {
  onValue(
    useAdminDetailDataController({
      authChecked: true,
      isAuthenticated: false,
      catalogWorkspaceState,
      setError,
    })
  );

  return createElement("div", null, "probe");
}

function PublicLinkHookProbe({
  onValue,
  catalogWorkspaceState,
  detailDataControllerState,
}) {
  onValue(
    useAdminPublicLinkController({
      catalogWorkspaceState,
      detailDataControllerState,
    })
  );

  return createElement("div", null, "probe");
}

describe("detail workspace controller slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the detail data controller", () => {
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
    const detailState = {
      identity: { name: "Rosie" },
    };

    useAdminDetailState.mockReturnValue(detailState);

    let result;
    renderToStaticMarkup(
      createElement(DetailDataHookProbe, {
        onValue: (value) => {
          result = value;
        },
        catalogWorkspaceState,
        setError,
      })
    );

    expect(useAdminDetailState).toHaveBeenCalledWith({
      isEnabled: false,
      selected: catalogWorkspaceState.catalogState.selected,
      dolls: catalogWorkspaceState.catalogState.dolls,
      generatedV1ContentByDoll:
        catalogWorkspaceState.managedContentStoreState.generatedV1ContentByDoll,
      setError,
    });
    expect(result).toEqual({
      detailState,
    });
  });

  it("wires the public-link controller", () => {
    const catalogWorkspaceState = {
      catalogState: {
        selected: { id: "doll-1" },
      },
    };
    const detailDataControllerState = {
      detailState: {
        identity: { name: "Rosie" },
      },
    };
    const publicLinkState = {
      selectedSlug: "rosie",
    };

    useAdminPublicLinkState.mockReturnValue(publicLinkState);

    let result;
    renderToStaticMarkup(
      createElement(PublicLinkHookProbe, {
        onValue: (value) => {
          result = value;
        },
        catalogWorkspaceState,
        detailDataControllerState,
      })
    );

    expect(useAdminPublicLinkState).toHaveBeenCalledWith({
      selected: catalogWorkspaceState.catalogState.selected,
      identity: detailDataControllerState.detailState.identity,
    });
    expect(result).toEqual({
      publicLinkState,
    });
  });
});
