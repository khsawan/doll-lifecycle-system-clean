"use client";

import {
  disabledActionStyle,
  disabledFormControlStyle,
  inputStyle,
  labelStyle,
  operatorHintStyle,
  primaryButton,
  secondaryButton,
  sectionLabelStyle,
  workflowFeedbackMessageStyle,
} from "../styles/primitives";
import { useAdminUniverses } from "../hooks/useAdminUniverses";

const saveGreenButton = { ...primaryButton, background: "#166534" };

export function AdminUniversePanel() {
  const {
    universes,
    loading,
    saving,
    notice,
    error,
    editingId,
    editDraft,
    isCreating,
    createDraft,
    openEdit,
    cancelEdit,
    updateEditDraft,
    saveEdit,
    openCreate,
    cancelCreate,
    updateCreateDraft,
    saveCreate,
  } = useAdminUniverses({ isEnabled: true });

  if (loading) {
    return <div style={loadingStyle}>Loading universes...</div>;
  }

  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <div style={sectionLabelStyle}>Universe Management</div>
          <div style={titleStyle}>Universes</div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={isCreating || saving ? disabledActionStyle(primaryButton) : primaryButton}
          disabled={isCreating || saving}
        >
          New Universe
        </button>
      </div>

      {notice ? (
        <div style={workflowFeedbackMessageStyle("success", true)}>{notice}</div>
      ) : null}
      {error ? (
        <div style={workflowFeedbackMessageStyle("error", true)}>{error}</div>
      ) : null}

      {isCreating ? (
        <div style={createCardStyle}>
          <div style={sectionLabelStyle}>New Universe</div>
          <div style={fieldGridStyle}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={createDraft.name}
                onChange={(e) => updateCreateDraft("name", e.target.value)}
                style={inputStyle}
                placeholder="e.g. Farm World"
              />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                value={createDraft.slug}
                onChange={(e) => updateCreateDraft("slug", e.target.value)}
                style={inputStyle}
                placeholder="e.g. farm-world"
              />
            </div>
            <div>
              <label style={labelStyle}>Emotional Core</label>
              <input
                value={createDraft.emotional_core}
                onChange={(e) =>
                  updateCreateDraft("emotional_core", e.target.value)
                }
                style={inputStyle}
                placeholder="e.g. Warmth"
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                value={createDraft.description}
                onChange={(e) =>
                  updateCreateDraft("description", e.target.value)
                }
                style={inputStyle}
                placeholder="Short description of this universe"
              />
            </div>
          </div>
          <div style={cardActionsStyle}>
            <button
              type="button"
              onClick={saveCreate}
              style={saving ? disabledActionStyle(saveGreenButton) : saveGreenButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Create"}
            </button>
            <button
              type="button"
              onClick={cancelCreate}
              style={saving ? disabledActionStyle(secondaryButton) : secondaryButton}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {universes.length === 0 && !isCreating ? (
        <div style={operatorHintStyle("muted")}>
          No universes found. Use New Universe to create one.
        </div>
      ) : null}

      <div style={cardStackStyle}>
        {universes.map((universe) => {
          const isEditing = editingId === universe.id;
          const dollCount = universe.doll_count ?? 0;

          return (
            <div key={universe.id} style={universeCardStyle(isEditing)}>
              <div style={cardTopRowStyle}>
                <div style={cardIdentityStyle}>
                  <div style={universeNameStyle}>{universe.name}</div>
                  <div style={universeMetaStyle}>
                    {universe.emotional_core ? (
                      <span style={coreTagStyle}>{universe.emotional_core}</span>
                    ) : null}
                    <span style={slugTagStyle}>{universe.slug}</span>
                    <span style={statusTagStyle(universe.status)}>
                      {universe.status}
                    </span>
                    <span style={countTagStyle}>
                      {dollCount} {dollCount === 1 ? "doll" : "dolls"}
                    </span>
                  </div>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => openEdit(universe)}
                    style={
                      saving || editingId
                        ? disabledActionStyle(editButtonStyle)
                        : editButtonStyle
                    }
                    disabled={saving || !!editingId}
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                <div style={editExpandStyle}>
                  <div style={fieldGridStyle}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input
                        value={editDraft.name}
                        onChange={(e) =>
                          updateEditDraft("name", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Slug</label>
                      <input
                        value={universe.slug}
                        readOnly
                        style={disabledFormControlStyle(inputStyle)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Emotional Core</label>
                      <input
                        value={editDraft.emotional_core}
                        onChange={(e) =>
                          updateEditDraft("emotional_core", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <input
                        value={editDraft.description}
                        onChange={(e) =>
                          updateEditDraft("description", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={cardActionsStyle}>
                    <button
                      type="button"
                      onClick={() => saveEdit(universe.id)}
                      style={
                        saving ? disabledActionStyle(saveGreenButton) : saveGreenButton
                      }
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={
                        saving ? disabledActionStyle(secondaryButton) : secondaryButton
                      }
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const panelStyle = {
  display: "grid",
  gap: 20,
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#0f172a",
  margin: 0,
};

const loadingStyle = {
  color: "#64748b",
  padding: "20px 0",
};

const cardStackStyle = {
  display: "grid",
  gap: 12,
};

const universeCardStyle = (isEditing) => ({
  background: "#ffffff",
  border: isEditing ? "1px solid #0f172a" : "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 20,
  transition: "border-color 120ms ease",
});

const cardTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const cardIdentityStyle = {
  display: "grid",
  gap: 6,
};

const universeNameStyle = {
  fontWeight: 700,
  fontSize: 18,
  color: "#0f172a",
};

const universeMetaStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const coreTagStyle = {
  fontSize: 12,
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: "2px 8px",
};

const slugTagStyle = {
  fontSize: 12,
  background: "#f8fafc",
  color: "#475569",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "2px 8px",
  fontFamily: "monospace",
};

function statusTagStyle(status) {
  return {
    fontSize: 12,
    background: status === "active" ? "#ecfdf5" : "#fef9c3",
    color: status === "active" ? "#166534" : "#713f12",
    border: `1px solid ${status === "active" ? "#86efac" : "#fde68a"}`,
    borderRadius: 10,
    padding: "2px 8px",
  };
}

const countTagStyle = {
  fontSize: 12,
  color: "#94a3b8",
};

const editButtonStyle = {
  background: "transparent",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "6px 14px",
  fontSize: 13,
  color: "#475569",
  cursor: "pointer",
  flexShrink: 0,
};

const editExpandStyle = {
  marginTop: 16,
  paddingTop: 16,
  borderTop: "1px solid #e2e8f0",
  display: "grid",
  gap: 16,
};

const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const cardActionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const createCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 20,
  display: "grid",
  gap: 16,
};
