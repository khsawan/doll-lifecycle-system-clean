import { describe, expect, it } from "vitest";
import {
  resolveClipboardCopyError,
  resolvePublicPageOpenError,
} from "../../../../features/admin/domain/browserActions";

describe("admin browser action helpers", () => {
  it("returns a stable clipboard error when clipboard support is missing", () => {
    expect(resolveClipboardCopyError(false)).toBe("Clipboard copy failed.");
    expect(resolveClipboardCopyError(true)).toBe("");
  });

  it("requires a public url before trying to open a new tab", () => {
    expect(
      resolvePublicPageOpenError({
        url: "",
        hasWindowOpen: true,
      })
    ).toBe("No public URL is available for this doll.");
  });

  it("reports when the environment cannot open a new tab", () => {
    expect(
      resolvePublicPageOpenError({
        url: "https://example.com/doll/amara",
        hasWindowOpen: false,
      })
    ).toBe("Opening a new tab is not available in this environment.");
  });

  it("returns no error when a valid public url can be opened", () => {
    expect(
      resolvePublicPageOpenError({
        url: "https://example.com/doll/amara",
        hasWindowOpen: true,
      })
    ).toBe("");
  });
});
