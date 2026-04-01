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

function CharCounter({ value, max, noColor = false }) {
  const len = (value || "").length;
  const ratio = len / max;
  let color = "#94a3b8";
  if (!noColor) {
    if (len >= max) color = "#dc2626";
    else if (ratio >= 0.8) color = "#d97706";
  }
  return (
    <div style={{ ...charCounterStyle, color }}>
      {len} / {max}
    </div>
  );
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
            <div style={fieldGuidanceStyle}>What is she called? This is the name her world knows her by.</div>
            <input
              value={identity.name}
              maxLength={50}
              onChange={(event) =>
                setIdentity({ ...identity, name: event.target.value })
              }
              style={styles.inputStyle}
            />
            <CharCounter value={identity.name} max={50} />
          </div>

          <div>
            <label style={styles.labelStyle}>Personality</label>
            <div style={fieldGuidanceStyle}>How would someone describe her in three words? What stays true about her no matter where she is?</div>
            <input
              value={identity.personality_traits}
              maxLength={150}
              onChange={(event) =>
                setIdentity({ ...identity, personality_traits: event.target.value })
              }
              style={styles.inputStyle}
            />
            <CharCounter value={identity.personality_traits} max={150} />
          </div>

          <div>
            <label style={styles.labelStyle}>Notable Features</label>
            <div style={fieldGuidanceStyle}>What would a child notice first? A detail, a texture, something that makes her unmistakably her.</div>
            <input
              value={identity.notable_features}
              maxLength={150}
              onChange={(event) =>
                setIdentity({ ...identity, notable_features: event.target.value })
              }
              style={styles.inputStyle}
            />
            <CharCounter value={identity.notable_features} max={150} />
          </div>

          <div>
            <label style={styles.labelStyle}>Colour Palette</label>
            <div style={fieldGuidanceStyle}>What colours live in her world? Think of her clothes, her surroundings, the light around her.</div>
            <input
              value={identity.color_palette}
              maxLength={120}
              onChange={(event) =>
                setIdentity({ ...identity, color_palette: event.target.value })
              }
              style={styles.inputStyle}
            />
            <CharCounter value={identity.color_palette} max={120} />
          </div>
        </div>

        <div style={textSectionStyle}>
          <label style={styles.labelStyle}>Character World</label>
          <div style={fieldGuidanceStyle}>Where does she live and belong? Describe her environment in a sentence — the sights, the feeling, the pace of her world.</div>
          <textarea
            value={identity.character_world}
            maxLength={400}
            onChange={(event) =>
              setIdentity({ ...identity, character_world: event.target.value })
            }
            style={textareaStyle(styles.inputStyle)}
          />
          <CharCounter value={identity.character_world} max={400} noColor />
        </div>

        <div style={briefSectionStyle}>
          <div style={briefSectionLabelStyle}>Character Brief</div>

          <div style={identityGridStyle}>
            <div>
              <label style={styles.labelStyle}>Emotional Spark</label>
              <div style={fieldGuidanceStyle}>What lights her up? What makes her come alive?</div>
              <input
                value={identity.emotional_spark}
                maxLength={80}
                onChange={(event) =>
                  setIdentity({ ...identity, emotional_spark: event.target.value })
                }
                style={styles.inputStyle}
              />
              <CharCounter value={identity.emotional_spark} max={80} />
            </div>

            <div>
              <label style={styles.labelStyle}>Emotional Essence</label>
              <div style={fieldGuidanceStyle}>What feeling does she leave behind in a room?</div>
              <input
                value={identity.emotional_essence}
                maxLength={80}
                onChange={(event) =>
                  setIdentity({ ...identity, emotional_essence: event.target.value })
                }
                style={styles.inputStyle}
              />
              <CharCounter value={identity.emotional_essence} max={80} />
            </div>

            <div>
              <label style={styles.labelStyle}>Temperament</label>
              <div style={fieldGuidanceStyle}>How does she move through the world — fast, slow, careful, bold?</div>
              <input
                value={identity.temperament}
                maxLength={80}
                onChange={(event) =>
                  setIdentity({ ...identity, temperament: event.target.value })
                }
                style={styles.inputStyle}
              />
              <CharCounter value={identity.temperament} max={80} />
            </div>

            <div>
              <label style={styles.labelStyle}>Emotional Role</label>
              <div style={fieldGuidanceStyle}>What role does she play in a child's emotional life?</div>
              <input
                value={identity.emotional_role}
                maxLength={120}
                onChange={(event) =>
                  setIdentity({ ...identity, emotional_role: event.target.value })
                }
                style={styles.inputStyle}
              />
              <CharCounter value={identity.emotional_role} max={120} />
            </div>

            <div>
              <label style={styles.labelStyle}>Small Tenderness</label>
              <div style={fieldGuidanceStyle}>One small, specific, tender detail only she would do.</div>
              <input
                value={identity.small_tenderness}
                maxLength={150}
                onChange={(event) =>
                  setIdentity({ ...identity, small_tenderness: event.target.value })
                }
                style={styles.inputStyle}
              />
              <CharCounter value={identity.small_tenderness} max={150} />
            </div>

            <div>
              <label style={styles.labelStyle}>Signature Trait</label>
              <div style={fieldGuidanceStyle}>The one thing anyone would say about her first.</div>
              <input
                value={identity.signature_trait}
                maxLength={80}
                onChange={(event) =>
                  setIdentity({ ...identity, signature_trait: event.target.value })
                }
                style={styles.inputStyle}
              />
              <CharCounter value={identity.signature_trait} max={80} />
            </div>
          </div>

          <div style={textSectionStyle}>
            <label style={styles.labelStyle}>Sample Voice Line</label>
            <div style={fieldGuidanceStyle}>One sentence she might actually say, in her own voice.</div>
            <textarea
              value={identity.sample_voice_line}
              maxLength={200}
              onChange={(event) =>
                setIdentity({ ...identity, sample_voice_line: event.target.value })
              }
              style={textareaStyle(styles.inputStyle)}
            />
            <CharCounter value={identity.sample_voice_line} max={200} noColor />
          </div>
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

const briefSectionStyle = {
  borderTop: "1px solid #e2e8f0",
  paddingTop: 20,
  display: "grid",
  gap: 16,
};

const briefSectionLabelStyle = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  fontWeight: 700,
};

const fieldGuidanceStyle = {
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 6,
  lineHeight: 1.4,
};

const charCounterStyle = {
  fontSize: 11,
  textAlign: "right",
  marginTop: 4,
  color: "#94a3b8",
};
