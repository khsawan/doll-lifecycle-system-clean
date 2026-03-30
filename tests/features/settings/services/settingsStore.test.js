import { describe, expect, it } from "vitest";
import {
  buildSettingsValueMap,
  fetchSettingsRecords,
  fetchSettingsValueMap,
  persistSettingsRecords,
  resolveSettingsSupabaseConfig,
} from "../../../../features/settings/services/settingsStore";

function createMockClient(result = {}) {
  return {
    from(tableName) {
      expect(tableName).toBe("app_settings");

      const builder = {
        select() {
          return builder;
        },
        in() {
          return Promise.resolve(result);
        },
        upsert() {
          return Promise.resolve(result);
        },
      };

      return builder;
    },
  };
}

describe("settings store service", () => {
  it("prefers a service-role key when resolving server settings access", () => {
    expect(
      resolveSettingsSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
      })
    ).toEqual({
      url: "https://example.supabase.co",
      key: "service-role",
      isConfigured: true,
    });
  });

  it("reads persisted settings rows", async () => {
    const rows = [{ key: "brand_name", value: "Maille & Merveille" }];

    await expect(fetchSettingsRecords(createMockClient({ data: rows }))).resolves.toEqual(rows);
  });

  it("builds a normalized keyed settings map for selected rows", async () => {
    const rows = [
      { key: "ai_provider", value: "anthropic" },
      { key: "ai_model", value: 123 },
      { key: "ignored", value: "nope" },
    ];

    expect(buildSettingsValueMap(rows, ["ai_provider", "ai_model"])).toEqual({
      ai_provider: "anthropic",
      ai_model: "123",
    });

    await expect(
      fetchSettingsValueMap(createMockClient({ data: rows }), ["ai_provider", "ai_model"])
    ).resolves.toEqual({
      ai_provider: "anthropic",
      ai_model: "123",
    });
  });

  it("persists settings rows through app_settings upserts", async () => {
    const rows = [{ key: "default_cta", value: "Discover the collection" }];

    await expect(
      persistSettingsRecords(createMockClient({ data: null, error: null }), rows)
    ).resolves.toEqual(rows);
  });
});
