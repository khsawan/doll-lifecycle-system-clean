import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/domain/runtime", () => ({
  buildAdminVersionInfo: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminAuthenticatedShellController", () => ({
  useAdminAuthenticatedShellController: vi.fn(),
}));

import { buildAdminVersionInfo } from "../../../../features/admin/domain/runtime";
import { useAdminAuthenticatedShellController } from "../../../../features/admin/hooks/useAdminAuthenticatedShellController";
import { useAdminPageShellController } from "../../../../features/admin/hooks/useAdminPageShellController";

function HookProbe({ onValue, pageAccessControllerState }) {
  onValue(
    useAdminPageShellController({
      pageAccessControllerState,
    })
  );
  return createElement("div", null, "probe");
}

describe("admin page shell controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildAdminVersionInfo.mockReturnValue({ label: "build-123" });
  });

  it("builds the admin version label and delegates authenticated shell composition", () => {
    const pageAccessControllerState = {
      authChecked: true,
      adminProtectionEnabled: true,
      isAuthenticated: true,
      handleLogout: vi.fn(),
    };

    useAdminAuthenticatedShellController.mockReturnValue({ shell: true });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        pageAccessControllerState,
      })
    );

    expect(useAdminAuthenticatedShellController).toHaveBeenCalledWith({
      authChecked: true,
      adminProtectionEnabled: true,
      isAuthenticated: true,
      handleLogout: pageAccessControllerState.handleLogout,
      adminVersionLabel: "build-123",
    });
    expect(result).toEqual({
      authenticatedShellState: { shell: true },
    });
  });
});
