import { describe, expect, it, vi } from "vitest";
import {
  fetchAdminDollDetailResources,
  saveAdminContentPackViaApi,
  saveAdminOrderViaApi,
  saveAdminStoryViaApi,
} from "../../../../features/admin/services/detailApi";

describe("admin detail API service", () => {
  it("loads selected doll detail resources through the protected detail endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        stories: [{ type: "teaser", content: "Hello" }],
        contentRows: [{ type: "promo_hook", content: "Hook" }],
        orders: [{ customer_name: "Layla" }],
      }),
    }));

    await expect(fetchAdminDollDetailResources(fetcher, 5)).resolves.toEqual({
      stories: [{ type: "teaser", content: "Hello" }],
      contentRows: [{ type: "promo_hook", content: "Hook" }],
      orders: [{ customer_name: "Layla" }],
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/5/detail", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("surfaces API errors for selected doll detail loads", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "boom",
      }),
    }));

    await expect(fetchAdminDollDetailResources(fetcher, 9)).rejects.toThrow("boom");
  });

  it("saves a story through the protected doll story endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        rows: [{ type: "teaser", content: "Hello" }],
        dollPatch: { status: "story" },
      }),
    }));

    await expect(
      saveAdminStoryViaApi(fetcher, 5, {
        teaser: "Hello",
      })
    ).resolves.toEqual({
      rows: [{ type: "teaser", content: "Hello" }],
      dollPatch: { status: "story" },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/5/story", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        story: {
          teaser: "Hello",
        },
      }),
    });
  });

  it("saves a content pack through the protected doll content-pack endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        rows: [{ type: "promo_hook", content: "Hook" }],
        dollPatch: { status: "content" },
      }),
    }));

    await expect(
      saveAdminContentPackViaApi(fetcher, 5, {
        hook: "Hook",
      })
    ).resolves.toEqual({
      rows: [{ type: "promo_hook", content: "Hook" }],
      dollPatch: { status: "content" },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/5/content-pack", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contentPack: {
          hook: "Hook",
        },
      }),
    });
  });

  it("saves an order through the protected doll order endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        orderRow: { customer_name: "Layla" },
        dollPatch: { status: "sales", sales_status: "reserved" },
      }),
    }));

    await expect(
      saveAdminOrderViaApi(
        fetcher,
        5,
        {
          customer_name: "Layla",
        },
        {
          persistSalesStatus: true,
          nextSalesStatus: "reserved",
        }
      )
    ).resolves.toEqual({
      orderRow: { customer_name: "Layla" },
      dollPatch: { status: "sales", sales_status: "reserved" },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/5/order", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        order: {
          customer_name: "Layla",
        },
        options: {
          persistSalesStatus: true,
          nextSalesStatus: "reserved",
        },
      }),
    });
  });
});
