import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminPageAccessController", () => ({
  useAdminPageAccessController: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminPageShellController", () => ({
  useAdminPageShellController: vi.fn(),
}));

import { useAdminPageAccessController } from "../../../../features/admin/hooks/useAdminPageAccessController";
import { useAdminPageController } from "../../../../features/admin/hooks/useAdminPageController";
import { useAdminPageShellController } from "../../../../features/admin/hooks/useAdminPageShellController";

function HookProbe({ onValue }) {
  onValue(useAdminPageController());
  return createElement("div", null, "probe");
}

describe("admin page controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminPageShellController.mockReturnValue({ authenticatedShellState: { shell: true } });
  });

  it("composes the page access and page shell controllers", () => {
    const handleLogin = vi.fn();

    const pageAccessControllerState = {
      adminProtectionEnabled: true,
      isAuthenticated: true,
      authChecked: true,
      loginPassword: "",
      loginError: "",
      handleLoginPasswordChange: vi.fn(),
      handleLogin,
      handleLogout: vi.fn(),
    };

    useAdminPageAccessController.mockReturnValue(pageAccessControllerState);

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
      })
    );

    expect(useAdminPageAccessController).toHaveBeenCalledWith();
    expect(useAdminPageShellController).toHaveBeenCalledWith({
      pageAccessControllerState,
    });
    expect(result).toMatchObject({
      authChecked: true,
      adminProtectionEnabled: true,
      isAuthenticated: true,
      loginPassword: "",
      loginError: "",
      handleLogin,
      authenticatedShellState: { shell: true },
    });
  });
});
