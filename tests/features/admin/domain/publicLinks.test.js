import { describe, expect, it } from "vitest";
import { buildAdminPublicLinkState } from "../../../../features/admin/domain/publicLinks";

describe("admin public link domain helpers", () => {
  it("prefers a saved slug when it exists", () => {
    expect(
      buildAdminPublicLinkState({
        selected: {
          id: "doll-1",
          slug: "rosie-bloom",
          name: "Rosie Bloom",
          internal_id: "DOLL-001",
        },
        identity: {
          name: "Renamed Rosie",
        },
        publicBaseUrl: "https://example.com",
        previousLockState: {
          id: null,
          legacyLockedSlug: "",
        },
      })
    ).toMatchObject({
      savedSlug: "rosie-bloom",
      legacyLockedSlug: "",
      slugLocked: true,
      selectedSlug: "rosie-bloom",
      publicPath: "/doll/rosie-bloom",
      publicUrl: "https://example.com/doll/rosie-bloom",
      nextLockState: {
        id: "doll-1",
        legacyLockedSlug: "",
      },
    });
  });

  it("creates and preserves a legacy locked slug for QR-enabled dolls without a saved slug", () => {
    const initialState = buildAdminPublicLinkState({
      selected: {
        id: "doll-1",
        slug: "",
        qr_code_url: "https://example.com/qr.png",
        name: "Rosie Bloom",
        internal_id: "DOLL-001",
      },
      identity: {
        name: "Rosie Bloom",
      },
      publicBaseUrl: "https://example.com",
      previousLockState: {
        id: null,
        legacyLockedSlug: "",
      },
    });

    const preservedState = buildAdminPublicLinkState({
      selected: {
        id: "doll-1",
        slug: "",
        qr_code_url: "https://example.com/qr.png",
        name: "Rosie Bloom",
        internal_id: "DOLL-001",
      },
      identity: {
        name: "Renamed In Editor",
      },
      publicBaseUrl: "https://example.com",
      previousLockState: initialState.nextLockState,
    });

    expect(initialState.legacyLockedSlug).toBe("rosie-bloom");
    expect(preservedState.legacyLockedSlug).toBe("rosie-bloom");
    expect(preservedState.selectedSlug).toBe("rosie-bloom");
  });

  it("falls back to the current identity name when no saved or locked slug exists", () => {
    expect(
      buildAdminPublicLinkState({
        selected: {
          id: "doll-2",
          slug: "",
          qr_code_url: "",
          name: "Placeholder",
          internal_id: "DOLL-002",
        },
        identity: {
          name: "Luna Star",
        },
        publicBaseUrl: "https://example.com",
        previousLockState: {
          id: null,
          legacyLockedSlug: "",
        },
      })
    ).toMatchObject({
      savedSlug: "",
      legacyLockedSlug: "",
      slugLocked: false,
      selectedSlug: "luna-star",
      publicPath: "/doll/luna-star",
      publicUrl: "https://example.com/doll/luna-star",
    });
  });
});
