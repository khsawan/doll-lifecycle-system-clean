import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminAccess", () => ({
  useAdminAccess: vi.fn(),
}));

import { useAdminAccess } from "../../../../features/admin/hooks/useAdminAccess";
import { useAdminPageAccessController } from "../../../../features/admin/hooks/useAdminPageAccessController";

function HookProbe({ onValue }) {
  onValue(useAdminPageAccessController());
  return createElement("div", null, "probe");
}

describe("admin page access controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps admin access state into the page access contract", () => {
    const handleLogin = vi.fn();
    const handleLogout = vi.fn();

    useAdminAccess.mockReturnValue({
      isProtectionEnabled: true,
      isAuthenticated: true,
      authChecked: true,
      loginPassword: "",
      setLoginPassword: vi.fn(),
      loginError: "",
      setLoginError: vi.fn(),
      handleLogin,
      handleLogout,
    });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
      })
    );

    expect(result).toMatchObject({
      adminProtectionEnabled: true,
      isAuthenticated: true,
      authChecked: true,
      loginPassword: "",
      loginError: "",
      handleLogin,
      handleLogout,
    });
  });

  it("clears the login error while updating the password field", () => {
    const setLoginPassword = vi.fn();
    const setLoginError = vi.fn();

    useAdminAccess.mockReturnValue({
      isProtectionEnabled: true,
      isAuthenticated: false,
      authChecked: true,
      loginPassword: "old",
      setLoginPassword,
      loginError: "Incorrect password.",
      setLoginError,
      handleLogin: vi.fn(),
      handleLogout: vi.fn(),
    });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
      })
    );

    result.handleLoginPasswordChange("new-secret");

    expect(setLoginPassword).toHaveBeenCalledWith("new-secret");
    expect(setLoginError).toHaveBeenCalledWith("");
  });
});
