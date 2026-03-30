import { describe, expect, it, vi } from "vitest";
import {
  createAdminCatalogDoll,
  fetchAdminCatalog,
} from "../../../../features/admin/services/catalogApi";

describe("admin catalog API service", () => {
  it("loads themes and dolls through the protected catalog endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        themes: ["Unassigned", "Forest Friends"],
        dolls: [{ id: 1, name: "Rosie" }],
      }),
    }));

    await expect(fetchAdminCatalog(fetcher)).resolves.toEqual({
      themes: ["Unassigned", "Forest Friends"],
      dolls: [{ id: 1, name: "Rosie" }],
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/catalog", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("posts doll creation payloads and surfaces API errors", async () => {
    const payload = {
      basePayload: {
        internal_id: "DOLL-001",
        name: "Rosie",
      },
      defaultPipelineState: {
        registered: { status: "open" },
      },
      pipelineTimestamp: "2026-03-29T00:00:00.000Z",
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          doll: { id: 1, name: "Rosie" },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "boom",
        }),
      });

    await expect(createAdminCatalogDoll(fetcher, payload)).resolves.toEqual({
      id: 1,
      name: "Rosie",
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/catalog", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await expect(createAdminCatalogDoll(fetcher, payload)).rejects.toThrow("boom");
  });
});
