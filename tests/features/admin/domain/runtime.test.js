import { describe, expect, it } from "vitest";
import {
  buildAdminVersionInfo,
  resolvePublicBaseUrl,
} from "../../../../features/admin/domain/runtime";

describe("admin runtime helpers", () => {
  it("prefers configured site url over browser origin and trims trailing slashes", () => {
    expect(
      resolvePublicBaseUrl({
        siteUrl: "https://example.com///",
        origin: "https://fallback.local",
      })
    ).toBe("https://example.com");
  });

  it("falls back to browser origin when site url is unavailable", () => {
    expect(
      resolvePublicBaseUrl({
        siteUrl: " ",
        origin: "https://fallback.local",
      })
    ).toBe("https://fallback.local");
  });

  it("builds stable admin version metadata with readable label text", () => {
    expect(
      buildAdminVersionInfo({
        sha: "1234567890abcdef",
        message: "Refactor admin route",
        env: "preview",
      })
    ).toEqual({
      sha: "1234567",
      message: "Refactor admin route",
      env: "Preview",
      label: "v1234567 | Preview | Refactor admin route",
    });
  });

  it("falls back to unknown fields when metadata is missing", () => {
    expect(buildAdminVersionInfo({})).toEqual({
      sha: "unknown",
      message: "unknown",
      env: "Unknown",
      label: "vunknown | Unknown | unknown",
    });
  });
});
