import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminRouteView } from "../../../../features/admin/components/AdminRouteView";

describe("admin route view", () => {
  it("renders the access checking screen before auth is resolved", () => {
    const markup = renderToStaticMarkup(
      createElement(AdminRouteView, {
        authChecked: false,
        adminProtectionEnabled: true,
        isAuthenticated: false,
      })
    );

    expect(markup).toContain("Checking admin access...");
  });

  it("renders the login screen when protection is enabled and access is not verified", () => {
    const markup = renderToStaticMarkup(
      createElement(AdminRouteView, {
        authChecked: true,
        adminProtectionEnabled: true,
        isAuthenticated: false,
        loginError: "Incorrect password.",
        loginPassword: "secret",
        onPasswordChange: () => {},
        onSubmit: () => {},
      })
    );

    expect(markup).toContain("Admin Access");
    expect(markup).toContain("Incorrect password.");
    expect(markup).toContain("Password");
  });

  it("renders the provided authenticated shell when access is granted", () => {
    const markup = renderToStaticMarkup(
      createElement(AdminRouteView, {
        authChecked: true,
        adminProtectionEnabled: true,
        isAuthenticated: true,
        authenticatedShell: createElement("div", null, "Authenticated shell"),
      })
    );

    expect(markup).toContain("Authenticated shell");
  });
});
