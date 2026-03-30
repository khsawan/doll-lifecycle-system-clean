import { describe, expect, it, vi } from "vitest";
import {
  fetchAdminSettings,
  saveAdminSettingsSection,
} from "../../../../features/settings/services/settingsApi";

describe("settings API service", () => {
  it("loads settings through the authenticated admin endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        settings: [{ key: "brand_name", value: "Maille & Merveille" }],
      }),
    }));

    await expect(fetchAdminSettings(fetcher)).resolves.toEqual([
      { key: "brand_name", value: "Maille & Merveille" },
    ]);
    expect(fetcher).toHaveBeenCalledWith("/api/admin/settings", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("sends section save payloads and surfaces API errors", async () => {
    const rows = [{ key: "default_tone", value: "Gentle" }];
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: rows }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "boom" }),
      });

    await expect(saveAdminSettingsSection(fetcher, rows)).resolves.toEqual(rows);
    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/settings", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        settings: rows,
      }),
    });

    await expect(saveAdminSettingsSection(fetcher, rows)).rejects.toThrow("boom");
  });
});
