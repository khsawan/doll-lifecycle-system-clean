import { describe, expect, it, vi } from "vitest";
import {
  deleteAdminDollPermanentlyViaApi,
  saveAdminDollPatchViaApi,
} from "../../../../features/admin/services/dollApi";

describe("admin doll API service", () => {
  it("patches doll fields through the protected doll endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        dollPatch: {
          commerce_status: "published",
          status: "digital",
        },
      }),
    }));

    await expect(
      saveAdminDollPatchViaApi(fetcher, 5, {
        commerce_status: "published",
        status: "digital",
      })
    ).resolves.toEqual({
      dollPatch: {
        commerce_status: "published",
        status: "digital",
      },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/5", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        patch: {
          commerce_status: "published",
          status: "digital",
        },
      }),
    });
  });

  it("surfaces API errors for protected doll patch saves", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "boom",
      }),
    }));

    await expect(
      saveAdminDollPatchViaApi(fetcher, 7, {
        status: "archived",
      })
    ).rejects.toThrow("boom");
  });

  it("deletes a doll through the protected doll endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        deletedId: 7,
        storagePaths: ["qr-codes/rosie.png", "dolls/rosie.png"],
      }),
    }));

    await expect(
      deleteAdminDollPermanentlyViaApi(fetcher, 7, {
        storagePaths: ["qr-codes/rosie.png", "dolls/rosie.png"],
      })
    ).resolves.toEqual({
      deletedId: 7,
      storagePaths: ["qr-codes/rosie.png", "dolls/rosie.png"],
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/7", {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        storagePaths: ["qr-codes/rosie.png", "dolls/rosie.png"],
      }),
    });
  });

  it("surfaces API errors for protected doll deletes", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "boom",
      }),
    }));

    await expect(
      deleteAdminDollPermanentlyViaApi(fetcher, 7, {
        storagePaths: ["qr-codes/rosie.png"],
      })
    ).rejects.toThrow("boom");
  });
});
