import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  buildAdminSessionCookieOptions,
  createAdminSessionToken,
  readAdminSessionCookieState,
  resolveAdminAuthConfig,
  verifyAdminSessionToken,
} from "../../../../features/admin/domain/session";

describe("admin session helpers", () => {
  it("resolves auth config from server-first env values", () => {
    expect(
      resolveAdminAuthConfig({
        ADMIN_PASSWORD: "server-secret",
        NEXT_PUBLIC_ADMIN_PASSWORD: "public-secret",
        ADMIN_SESSION_SECRET: "session-secret",
      })
    ).toEqual({
      password: "server-secret",
      sessionSecret: "session-secret",
      protectionEnabled: true,
    });
  });

  it("falls back to the public password when no server-only values exist", () => {
    expect(
      resolveAdminAuthConfig({
        NEXT_PUBLIC_ADMIN_PASSWORD: "public-secret",
      })
    ).toEqual({
      password: "public-secret",
      sessionSecret: "public-secret",
      protectionEnabled: true,
    });
  });

  it("creates verifiable signed admin session tokens", () => {
    const token = createAdminSessionToken({
      secret: "session-secret",
      now: 1_000,
      maxAgeSeconds: 60,
    });

    expect(
      verifyAdminSessionToken(token, {
        secret: "session-secret",
        now: 10_000,
      })
    ).toBe(true);
  });

  it("rejects tampered or expired tokens", () => {
    const token = createAdminSessionToken({
      secret: "session-secret",
      now: 1_000,
      maxAgeSeconds: 60,
    });
    const [payload] = token.split(".");
    const tamperedToken = `${payload}.tampered`;

    expect(
      verifyAdminSessionToken(tamperedToken, {
        secret: "session-secret",
        now: 10_000,
      })
    ).toBe(false);

    expect(
      verifyAdminSessionToken(token, {
        secret: "session-secret",
        now: 62_000,
      })
    ).toBe(false);
  });

  it("treats missing protection as authenticated when reading cookie state", () => {
    expect(
      readAdminSessionCookieState("", {
        env: {},
      })
    ).toEqual({
      authenticated: true,
      protectionEnabled: false,
      shouldClearCookie: false,
    });
  });

  it("marks invalid protected cookies so routes can clear them", () => {
    expect(
      readAdminSessionCookieState("invalid-token", {
        env: {
          ADMIN_PASSWORD: "server-secret",
          ADMIN_SESSION_SECRET: "session-secret",
        },
      })
    ).toEqual({
      authenticated: false,
      protectionEnabled: true,
      shouldClearCookie: true,
    });
  });

  it("builds secure session cookie options with the expected defaults", () => {
    expect(buildAdminSessionCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });
  });
});
