import { describe, expect, it } from "vitest";
import {
  fetchAdminDollDetailResources,
  fetchAdminDolls,
  normalizeAdminDollRecord,
  persistAdminDollPatch,
} from "../../../../features/admin/services/dolls";
import { fetchThemeOptions } from "../../../../features/admin/services/themes";

function createMockClient(resultsByTable) {
  return {
    from(tableName) {
      const result = resultsByTable[tableName] || {};

      const builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        order() {
          return Promise.resolve(result);
        },
        limit() {
          return Promise.resolve(result);
        },
        update() {
          return {
            eq() {
              return Promise.resolve(result);
            },
          };
        },
        then(resolve, reject) {
          return Promise.resolve(result).then(resolve, reject);
        },
      };

      return builder;
    },
  };
}

describe("admin read services", () => {
  it("merges fetched theme names with the default theme list", async () => {
    const client = createMockClient({
      themes: {
        data: [{ name: "Forest Friends" }, { name: "Nature Friends" }],
      },
    });

    const themes = await fetchThemeOptions(client, ["Unassigned", "Nature Friends"]);

    expect(themes).toEqual(["Unassigned", "Forest Friends", "Nature Friends"]);
  });

  it("normalizes fetched dolls for admin consumption", async () => {
    const client = createMockClient({
      dolls: {
        data: [
          {
            id: 1,
            name: "Rosie",
            theme_name: "",
            created_at: "2026-03-28T10:00:00.000Z",
            pipeline_state: null,
          },
        ],
      },
    });

    const dolls = await fetchAdminDolls(client);

    expect(dolls).toHaveLength(1);
    expect(dolls[0].theme_name).toBe("Unassigned");
    expect(dolls[0].pipelineState.registered.status).toBe("open");
  });

  it("throws on doll list load errors", async () => {
    const client = createMockClient({
      dolls: {
        data: null,
        error: { message: "boom" },
      },
    });

    await expect(fetchAdminDolls(client)).rejects.toEqual({ message: "boom" });
  });

  it("returns detail resources while tolerating per-query read failures", async () => {
    const client = createMockClient({
      stories: {
        data: [{ type: "teaser", content: "Story" }],
      },
      content_assets: {
        error: { message: "content unavailable" },
      },
      orders: {
        data: [{ customer_name: "Amina" }],
      },
    });

    const resources = await fetchAdminDollDetailResources(client, 5);

    expect(resources).toEqual({
      stories: [{ type: "teaser", content: "Story" }],
      contentRows: [],
      orders: [{ customer_name: "Amina" }],
    });
  });

  it("normalizes an individual doll record consistently", () => {
    const doll = normalizeAdminDollRecord({
      id: 9,
      theme_name: null,
      created_at: "2026-03-28T10:00:00.000Z",
    });

    expect(doll.theme_name).toBe("Unassigned");
    expect(doll.pipelineState.registered.status).toBe("open");
  });

  it("persists doll field patches through the shared write helper", async () => {
    const client = createMockClient({
      dolls: {
        data: null,
        error: null,
      },
    });

    await expect(
      persistAdminDollPatch(client, 3, { generation_status: "generated" })
    ).resolves.toEqual({ generation_status: "generated" });
  });
});
