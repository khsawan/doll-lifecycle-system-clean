"use client";

import Link from "next/link";
import {
  inputStyle,
  labelStyle,
  secondaryButton,
  sectionSaveButtonLabel,
  sectionSaveButtonStyle,
} from "../../admin/styles/primitives";
import { SETTINGS_SECTION_CONFIG } from "../domain/settings";

export function SettingsPageContent({
  adminProtectionEnabled,
  onLogout,
  notice,
  error,
  loading,
  settings,
  savingSection,
  onSettingChange,
  onSaveSection,
  isSectionDirty,
  isSectionSaved,
}) {
  return (
    <main style={screenStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <div style={brandStyle}>MAILLE & MERVEILLE</div>

            <h1 style={titleStyle}>Settings</h1>

            <p style={leadStyle}>
              Global defaults for brand identity, AI behavior, and social copy.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <Link
              href="/"
              style={{
                ...secondaryButton,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to Admin
            </Link>

            {adminProtectionEnabled ? (
              <button
                type="button"
                onClick={onLogout}
                style={secondaryButton}
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        {notice ? <div style={noticeStyle}>{notice}</div> : null}
        {error ? <div style={errorStyle}>{error}</div> : null}

        {loading ? (
          <section style={{ ...cardStyle, marginTop: 24 }}>
            <div style={loadingTextStyle}>Loading settings...</div>
          </section>
        ) : (
          <div style={sectionStackStyle}>
            {SETTINGS_SECTION_CONFIG.map((section) => {
              const dirty = isSectionDirty(section);
              const saved = isSectionSaved(section);
              const saving = savingSection === section.id;
              const disabled = saving || (!dirty && saved);

              return (
                <section key={section.id} style={cardStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>{section.title}</div>
                    <button
                      type="button"
                      onClick={() => onSaveSection(section)}
                      style={sectionSaveButtonStyle(dirty, saving, saved)}
                      disabled={disabled}
                    >
                      {sectionSaveButtonLabel(section.saveLabel, dirty, saving, saved)}
                    </button>
                  </div>

                  <div style={fieldGridStyle}>
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label style={labelStyle}>{field.label}</label>
                        <input
                          value={settings[field.key]}
                          onChange={(event) =>
                            onSettingChange(field.key, event.target.value)
                          }
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

const screenStyle = {
  background: "#f6f7fb",
  minHeight: "100vh",
  padding: 32,
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
};

const containerStyle = {
  maxWidth: 1040,
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 16,
  flexWrap: "wrap",
};

const headerActionsStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const brandStyle = {
  letterSpacing: 3,
  fontSize: 14,
  color: "#64748b",
  marginBottom: 8,
};

const titleStyle = {
  fontSize: 50,
  margin: 0,
  lineHeight: 1.05,
};

const leadStyle = {
  fontSize: 18,
  color: "#475569",
  maxWidth: 760,
  marginTop: 12,
};

const sectionStackStyle = {
  display: "grid",
  gap: 20,
  marginTop: 24,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 24,
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const sectionTitleStyle = {
  fontWeight: 700,
  fontSize: 22,
};

const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const loadingTextStyle = {
  color: "#64748b",
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
