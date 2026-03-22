"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasSupabaseEnv, supabase } from "../../lib/supabase";

const SETTINGS_KEYS = [
  "brand_name",
  "public_base_url",
  "ai_provider",
  "ai_model",
  "default_cta",
  "default_tone",
];

const EMPTY_SETTINGS = {
  brand_name: "",
  public_base_url: "",
  ai_provider: "",
  ai_model: "",
  default_cta: "",
  default_tone: "",
};

const SECTION_CONFIG = [
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

function normalizeSettingValue(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function sectionSaveButtonLabel(defaultLabel, isDirty, isSaving, isSaved) {
  if (isSaving) return "Saving...";
  if (!isDirty && isSaved) return "Saved";
  return defaultLabel;
}

function sectionSaveButtonStyle(isDirty, isSaving, isSaved) {
  if (isSaving) {
    return {
      ...primaryButton,
      background: "#15803d",
      opacity: 0.85,
      cursor: "progress",
    };
  }

  if (!isDirty && isSaved) {
    return {
      ...secondaryButton,
      background: "#dcfce7",
      color: "#166534",
      opacity: 0.65,
      cursor: "not-allowed",
    };
  }

  return {
    ...primaryButton,
    background: "#166534",
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(EMPTY_SETTINGS);
  const [persistedKeys, setPersistedKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      if (!hasSupabaseEnv || !supabase) {
        setError("Supabase environment variables are missing.");
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", SETTINGS_KEYS);

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      const nextSettings = { ...EMPTY_SETTINGS };
      const nextPersistedKeys = {};

      for (const row of data || []) {
        if (!SETTINGS_KEYS.includes(row.key)) continue;
        nextSettings[row.key] = normalizeSettingValue(row.value);
        nextPersistedKeys[row.key] = true;
      }

      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      setPersistedKeys(nextPersistedKeys);
      setLoading(false);
    }

    loadSettings();
  }, []);

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setNotice("");
  }

  function isSectionDirty(section) {
    return section.keys.some((key) => settings[key] !== savedSettings[key]);
  }

  function isSectionSaved(section) {
    return section.keys.every((key) => Boolean(persistedKeys[key]));
  }

  async function saveSection(section) {
    if (!supabase) return;

    const nextValues = section.keys.reduce((acc, key) => {
      acc[key] = settings[key] ?? "";
      return acc;
    }, {});

    setSavingSection(section.id);
    setError("");
    setNotice("");

    const rows = section.keys.map((key) => ({
      key,
      value: nextValues[key],
    }));

    const { error: saveError } = await supabase
      .from("app_settings")
      .upsert(rows, { onConflict: "key" });

    if (saveError) {
      setError(saveError.message);
      setSavingSection("");
      return;
    }

    setSavedSettings((prev) => ({ ...prev, ...nextValues }));
    setPersistedKeys((prev) => ({
      ...prev,
      ...section.keys.reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}),
    }));
    setNotice(`${section.title} saved.`);
    setSavingSection("");
  }

  return (
    <main
      style={{
        background: "#f6f7fb",
        minHeight: "100vh",
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ letterSpacing: 3, fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              MAILLE & MERVEILLE
            </div>

            <h1 style={{ fontSize: 50, margin: 0, lineHeight: 1.05 }}>Settings</h1>

            <p style={{ fontSize: 18, color: "#475569", maxWidth: 760, marginTop: 12 }}>
              Global defaults for brand identity, AI behavior, and social copy.
            </p>
          </div>

          <Link
            href="/"
            style={{ ...secondaryButton, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Back to Admin
          </Link>
        </div>

        {notice ? (
          <div style={noticeStyle}>{notice}</div>
        ) : null}

        {error ? (
          <div style={errorStyle}>{error}</div>
        ) : null}

        {loading ? (
          <section style={{ ...cardStyle, marginTop: 24 }}>
            <div style={{ color: "#64748b" }}>Loading settings...</div>
          </section>
        ) : (
          <div style={{ display: "grid", gap: 20, marginTop: 24 }}>
            {SECTION_CONFIG.map((section) => {
              const dirty = isSectionDirty(section);
              const saved = isSectionSaved(section);
              const saving = savingSection === section.id;
              const disabled = !supabase || saving || (!dirty && saved);

              return (
                <section key={section.id} style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 22 }}>{section.title}</div>
                    <button
                      type="button"
                      onClick={() => saveSection(section)}
                      style={sectionSaveButtonStyle(dirty, saving, saved)}
                      disabled={disabled}
                    >
                      {sectionSaveButtonLabel(section.saveLabel, dirty, saving, saved)}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label style={labelStyle}>{field.label}</label>
                        <input
                          value={settings[field.key]}
                          onChange={(e) => updateSetting(field.key, e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 24,
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  color: "#475569",
  fontSize: 15,
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid #cbd5e1",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const primaryButton = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const secondaryButton = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const noticeStyle = {
  marginTop: 24,
  background: "#dff5e7",
  border: "1px solid #9fe0b4",
  color: "#166534",
  padding: 16,
  borderRadius: 16,
};

const errorStyle = {
  marginTop: 24,
  background: "#fee2e2",
  border: "1px solid #fca5a5",
  color: "#991b1b",
  padding: 16,
  borderRadius: 16,
};
