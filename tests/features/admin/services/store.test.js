import { describe, expect, it } from "vitest";
import { resolveAdminStoreConfig } from "../../../../features/admin/services/store";

describe("admin store config", () => {
  it("prefers a service-role key when resolving protected admin store access", () => {
    expect(
      resolveAdminStoreConfig({
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
});
