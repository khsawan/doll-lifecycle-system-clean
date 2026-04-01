"use client";

import { useEffect, useState } from "react";
import { saveAdminDollUniverseAssignmentViaApi } from "../services/dollApi";
import { fetchAdminUniverses } from "../services/universeApi";

function useUniverseSection(identity) {
  const fetcher = typeof fetch === "undefined" ? null : fetch;

  const [universes, setUniverses] = useState([]);
  const [universesLoading, setUniversesLoading] = useState(true);
  const [selectedUniverseId, setSelectedUniverseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fetcher) {
      setUniversesLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadUniverses() {
      setUniversesLoading(true);
      try {
        const data = await fetchAdminUniverses(fetcher);
        if (!isCancelled) {
          setUniverses(data);
        }
      } catch {
        // Universe list failure is non-blocking — selector stays empty
      } finally {
        if (!isCancelled) {
          setUniversesLoading(false);
        }
      }
    }

    void loadUniverses();

    return () => {
      isCancelled = true;
    };
  }, [fetcher]);

  // Sync dropdown to saved universe_id when doll changes or universe is saved
  useEffect(() => {
    setSelectedUniverseId(identity.universe_id || "");
  }, [identity.doll_id, identity.universe_id]);

  // Clear notices when active doll changes
  useEffect(() => {
    setNotice("");
    setError("");
  }, [identity.doll_id]);

  async function saveUniverseAssignment(setIdentity) {
    if (!fetcher || !identity.doll_id) {
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      await saveAdminDollUniverseAssignmentViaApi(
        fetcher,
        identity.doll_id,
        selectedUniverseId || null
      );
      setIdentity((prev) => ({ ...prev, universe_id: selectedUniverseId || null }));
      setNotice("Universe assignment saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save universe assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  const resolvedUniverseName = universes.find((u) => u.id === identity.universe_id)?.name || null;

  return {
    universes,
    universesLoading,
    selectedUniverseId,
    setSelectedUniverseId,
    saving,
    notice,
    error,
    saveUniverseAssignment,
    resolvedUniverseName,
  };
}

export function AdminCharacterPanel({
  isEditable,
  identity,
  setIdentity,
  themes,
  onSaveIdentity,
  styles,
}) {
  const universe = useUniverseSection(identity);

  return (
    <div style={departmentStackStyle}>
      <fieldset
        disabled={!isEditable}
        style={{
          ...fieldsetStyle,
          opacity: isEditable ? 1 : 0.84,
        }}
      >
        <div style={identityGridStyle}>
          <div>
            <label style={styles.labelStyle}>Name</label>
            <input
              value={identity.name}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  name: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>

          <div>
            <label style={styles.labelStyle}>Theme</label>
            <select
              value={identity.theme_name}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  theme_name: event.target.value,
                })
              }
              style={styles.inputStyle}
            >
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.labelStyle}>Personality traits</label>
            <input
              value={identity.personality_traits}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  personality_traits: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>

          <div>
            <label style={styles.labelStyle}>Emotional hook</label>
            <input
              value={identity.emotional_hook}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  emotional_hook: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>

          <div>
            <label style={styles.labelStyle}>Expression Feel</label>
            <input
              value={identity.expression_feel}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  expression_feel: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>
        </div>

        <div style={textSectionStyle}>
          <label style={styles.labelStyle}>Short intro</label>
          <textarea
            value={identity.short_intro}
            onChange={(event) =>
              setIdentity({
                ...identity,
                short_intro: event.target.value,
              })
            }
            style={textareaStyle(styles.inputStyle)}
          />
        </div>

        <div style={textSectionStyle}>
          <label style={styles.labelStyle}>Character World</label>
          <textarea
            value={identity.character_world}
            onChange={(event) =>
              setIdentity({
                ...identity,
                character_world: event.target.value,
              })
            }
            style={textareaStyle(styles.inputStyle)}
          />
        </div>

        <div style={saveRowStyle}>
          <button type="button" onClick={onSaveIdentity} style={styles.primaryButton}>
            Save Identity
          </button>
        </div>
      </fieldset>

      <div style={universeSectionStyle}>
        <div style={universeSectionLabelStyle}>Universe Assignment</div>

        {universe.notice ? (
          <div style={universeNoticeStyle}>{universe.notice}</div>
        ) : null}
        {universe.error ? (
          <div style={universeErrorStyle}>{universe.error}</div>
        ) : null}

        <div style={universeRowStyle}>
          <div style={universeFieldStyle}>
            <label style={styles.labelStyle}>Universe</label>
            <select
              value={universe.selectedUniverseId}
              onChange={(e) => universe.setSelectedUniverseId(e.target.value)}
              style={styles.inputStyle}
              disabled={!isEditable || universe.universesLoading || universe.saving}
            >
              <option value="">— Unassigned —</option>
              {universe.universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.emotional_core ? ` — ${u.emotional_core}` : ""}
                </option>
              ))}
            </select>
            {universe.resolvedUniverseName ? (
              <div style={universeCurrentLabelStyle}>
                Currently assigned: {universe.resolvedUniverseName}
              </div>
            ) : (
              <div style={universeCurrentLabelStyle}>Currently unassigned</div>
            )}
          </div>

          <div style={universeActionStyle}>
            <button
              type="button"
              onClick={() => universe.saveUniverseAssignment(setIdentity)}
              style={
                !isEditable || universe.saving
                  ? { ...universeAssignButtonStyle, opacity: 0.6, cursor: "not-allowed" }
                  : universeAssignButtonStyle
              }
              disabled={!isEditable || universe.saving}
            >
              {universe.saving ? "Saving..." : "Assign Universe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const departmentStackStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

const fieldsetStyle = {
  border: "none",
  padding: 0,
  margin: 0,
  minInlineSize: 0,
  display: "grid",
  gap: 16,
};

const identityGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const textSectionStyle = {
  marginTop: 16,
};

function textareaStyle(inputStyle) {
  return {
    ...inputStyle,
    minHeight: 120,
    resize: "vertical",
  };
}

const saveRowStyle = {
  marginTop: 18,
};

const universeSectionStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 12,
};

const universeSectionLabelStyle = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  fontWeight: 700,
};

const universeRowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "flex-end",
  flexWrap: "wrap",
};

const universeFieldStyle = {
  flex: 1,
  minWidth: 200,
  display: "grid",
  gap: 6,
};

const universeActionStyle = {
  flexShrink: 0,
};

const universeAssignButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const universeCurrentLabelStyle = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 2,
};

const universeNoticeStyle = {
  padding: "8px 10px",
  borderRadius: 12,
  fontSize: 13,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#166534",
};

const universeErrorStyle = {
  padding: "8px 10px",
  borderRadius: 12,
  fontSize: 13,
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
};
