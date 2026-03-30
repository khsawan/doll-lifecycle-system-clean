import { describe, expect, it } from "vitest";
import {
  buildSettingsSectionRows,
  buildSettingsState,
  EMPTY_SETTINGS,
  isSettingsSectionDirty,
  isSettingsSectionSaved,
  normalizeSettingsPayloadRows,
  SETTINGS_SECTION_CONFIG,
} from "../../../../features/settings/domain/settings";

describe("settings domain helpers", () => {
  it("builds normalized settings state from persisted rows", () => {
    expect(
      buildSettingsState([
        { key: "brand_name", value: "Maille & Merveille" },
        { key: "ai_model", value: 123 },
        { key: "ignored", value: "nope" },
      ])
    ).toEqual({
      settings: {
        ...EMPTY_SETTINGS,
        brand_name: "Maille & Merveille",
        ai_model: "123",
      },
      persistedKeys: {
        brand_name: true,
        ai_model: true,
      },
    });
  });

  it("derives section save rows and dirty/saved flags consistently", () => {
    const section = SETTINGS_SECTION_CONFIG[0];
    const settings = {
      ...EMPTY_SETTINGS,
      brand_name: "Maille & Merveille",
      public_base_url: "https://example.com",
    };
    const savedSettings = {
      ...EMPTY_SETTINGS,
      brand_name: "Maille",
      public_base_url: "https://example.com",
    };

    expect(buildSettingsSectionRows(section, settings)).toEqual([
      { key: "brand_name", value: "Maille & Merveille" },
      { key: "public_base_url", value: "https://example.com" },
    ]);
    expect(isSettingsSectionDirty(section, settings, savedSettings)).toBe(true);
    expect(
      isSettingsSectionSaved(section, {
        brand_name: true,
        public_base_url: true,
      })
    ).toBe(true);
  });

  it("normalizes valid payload rows and rejects unsupported keys", () => {
    expect(
      normalizeSettingsPayloadRows([
        { key: "ai_provider", value: "anthropic" },
        { key: "ai_model", value: null },
      ])
    ).toEqual([
      { key: "ai_provider", value: "anthropic" },
      { key: "ai_model", value: "" },
    ]);

    expect(
      normalizeSettingsPayloadRows([
        { key: "invalid_key", value: "nope" },
      ])
    ).toBeNull();
  });
});
