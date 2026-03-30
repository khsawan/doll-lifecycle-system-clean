import { describe, expect, it } from "vitest";
import {
  buildAdminSessionState,
  resolveAdminSessionErrorMessage,
} from "../../../../features/admin/domain/access";

describe("admin access helpers", () => {
  it("treats disabled protection as authenticated", () => {
    expect(
      buildAdminSessionState({
        authenticated: false,
        protectionEnabled: false,
      })
    ).toEqual({
      isProtectionEnabled: false,
      isAuthenticated: true,
      authChecked: true,
    });
  });

  it("maps protected session responses into stable client state", () => {
    expect(
      buildAdminSessionState({
        authenticated: true,
        protectionEnabled: true,
      })
    ).toEqual({
      isProtectionEnabled: true,
      isAuthenticated: true,
      authChecked: true,
    });

    expect(
      buildAdminSessionState({
        authenticated: false,
        protectionEnabled: true,
      })
    ).toEqual({
      isProtectionEnabled: true,
      isAuthenticated: false,
      authChecked: true,
    });
  });

  it("prefers concrete server error messages and falls back cleanly", () => {
    expect(
      resolveAdminSessionErrorMessage(
        "Incorrect password.",
        "Could not verify admin access."
      )
    ).toBe("Incorrect password.");

    expect(
      resolveAdminSessionErrorMessage(
        "   ",
        "Could not verify admin access."
      )
    ).toBe("Could not verify admin access.");
  });
});
