export const SETTINGS_KEYS = [
  "brand_name",
  "public_base_url",
  "ai_provider",
  "ai_model",
  "default_cta",
  "default_tone",
];

export const EMPTY_SETTINGS = {
  brand_name: "",
  public_base_url: "",
  ai_provider: "",
  ai_model: "",
  default_cta: "",
  default_tone: "",
};

export const SETTINGS_SECTION_CONFIG = [
  {
    id: "general",
    title: "General",
    saveLabel: "Save General",
    keys: ["brand_name", "public_base_url"],
    fields: [
      { key: "brand_name", label: "Brand name" },
      { key: "public_base_url", label: "Public base URL" },
    ],
  },
  {
    id: "ai",
    title: "AI",
    saveLabel: "Save AI",
    keys: ["ai_provider", "ai_model"],
    fields: [
      { key: "ai_provider", label: "Default provider" },
      { key: "ai_model", label: "Default model" },
    ],
  },
  {
    id: "social",
    title: "Social",
    saveLabel: "Save Social",
    keys: ["default_cta", "default_tone"],
    fields: [
      { key: "default_cta", label: "Default CTA" },
      { key: "default_tone", label: "Default tone" },
    ],
  },
];

export function isSupportedSettingsKey(key) {
  return SETTINGS_KEYS.includes(key);
}

export function normalizeSettingValue(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function buildSettingsState(rows, emptySettings = EMPTY_SETTINGS) {
  const settings = { ...emptySettings };
  const persistedKeys = {};

  for (const row of rows || []) {
    if (!isSupportedSettingsKey(row?.key)) {
      continue;
    }

    settings[row.key] = normalizeSettingValue(row.value);
    persistedKeys[row.key] = true;
  }

  return {
    settings,
    persistedKeys,
  };
}

export function buildSettingsSectionRows(section, settings) {
  return section.keys.map((key) => ({
    key,
    value: normalizeSettingValue(settings[key]),
  }));
}

export function isSettingsSectionDirty(section, settings, savedSettings) {
  return section.keys.some(
    (key) =>
      normalizeSettingValue(settings[key]) !== normalizeSettingValue(savedSettings[key])
  );
}

export function isSettingsSectionSaved(section, persistedKeys) {
  return section.keys.every((key) => Boolean(persistedKeys[key]));
}

export function mergePersistedSettingsKeys(currentPersistedKeys, keys) {
  return {
    ...currentPersistedKeys,
    ...keys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}),
  };
}

export function normalizeSettingsPayloadRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1) {
    return null;
  }

  const normalizedRows = [];

  for (const row of rows) {
    const key = typeof row?.key === "string" ? row.key.trim() : "";

    if (!isSupportedSettingsKey(key)) {
      return null;
    }

    normalizedRows.push({
      key,
      value: normalizeSettingValue(row?.value),
    });
  }

  return normalizedRows;
}
