import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AdminAccessCheckingScreen,
  AdminLoginScreen,
} from "../../../../features/admin/components/AdminAccessScreens";

describe("admin access screens", () => {
  it("renders the access checking shell", () => {
    const markup = renderToStaticMarkup(createElement(AdminAccessCheckingScreen));

    expect(markup).toContain("MAILLE &amp; MERVEILLE");
    expect(markup).toContain("Doll Lifecycle System");
    expect(markup).toContain("Checking admin access...");
  });

  it("renders the login screen with password copy and inline errors", () => {
    const markup = renderToStaticMarkup(
      createElement(AdminLoginScreen, {
        loginError: "Incorrect password.",
        loginPassword: "secret",
        onPasswordChange: () => {},
        onSubmit: () => {},
        labelStyle: { display: "block" },
        inputStyle: { width: "100%" },
        primaryButton: { background: "#0f172a", color: "#ffffff" },
      })
    );

    expect(markup).toContain("Admin Access");
    expect(markup).toContain("Enter the admin password to continue.");
    expect(markup).toContain("Incorrect password.");
    expect(markup).toContain("Password");
    expect(markup).toContain(">Enter<");
  });
});
