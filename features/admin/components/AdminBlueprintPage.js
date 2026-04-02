"use client";

import { useState } from "react";
import { BLUEPRINT_STATE } from "../data/blueprintState";

// ─────────────────────────────────────────────
// Status colours
// ─────────────────────────────────────────────

const STATUS_COLORS = {
  done:          { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", bar: "#22c55e" },
  "in-progress": { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", bar: "#3b82f6" },
  next:          { bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe", bar: "#8b5cf6" },
  planned:       { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", bar: "#94a3b8" },
  blocked:       { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", bar: "#ef4444" },
};

function statusColors(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.planned;
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = statusColors(status);
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// PhaseRow — selection only, no inline expansion
// ─────────────────────────────────────────────

function PhaseRow({ phase, isSelected, onSelect }) {
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <button
        type="button"
        onClick={() => onSelect(phase.id)}
        style={{
          width: "100%",
          background: isSelected ? "#f8faff" : "none",
          border: "none",
          borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
          cursor: "pointer",
          padding: "11px 10px 11px 12px",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 12,
          alignItems: "center",
          textAlign: "left",
          borderRadius: isSelected ? "0 8px 8px 0" : 0,
          transition: "background 120ms",
        }}
      >
        <span style={{
          fontSize: 14,
          fontWeight: isSelected ? 700 : 600,
          color: isSelected ? "#1e40af" : "#0f172a",
        }}>
          {phase.name}
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
          {phase.weeks || ""}
        </span>
        <StatusBadge status={phase.status} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// LayerSection — collapsible, chevron via CSS
// ─────────────────────────────────────────────

function LayerSection({ layer, selectedPhaseId, onSelectPhase }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      overflow: "hidden",
      background: "#fff",
    }}>
      {/* Layer header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: "100%",
          background: "#f8fafc",
          border: "none",
          cursor: "pointer",
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
        }}
      >
        {/* Chevron — CSS only */}
        <span style={{
          display: "inline-block",
          width: 16,
          height: 16,
          flexShrink: 0,
          borderRight: "2px solid #94a3b8",
          borderBottom: "2px solid #94a3b8",
          transform: collapsed ? "rotate(-45deg)" : "rotate(45deg)",
          marginTop: collapsed ? 4 : 0,
          transition: "transform 160ms",
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>
          {layer.title}
        </span>
        <StatusBadge status={layer.status} />
      </button>

      {/* Phase list */}
      {!collapsed && (
        <div style={{ padding: "4px 0" }}>
          {(layer.phases || []).map((phase) => (
            <PhaseRow
              key={phase.id}
              phase={phase}
              isSelected={selectedPhaseId === phase.id}
              onSelect={onSelectPhase}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DetailPanel — sticky right column
// ─────────────────────────────────────────────

function DetailPanel({ phase }) {
  if (!phase) {
    return (
      <div style={detailPanelStyle}>
        <p style={{
          fontSize: 13,
          color: "#cbd5e1",
          textAlign: "center",
          marginTop: 40,
        }}>
          Select a phase to see details
        </p>
      </div>
    );
  }

  const c = statusColors(phase.status);

  return (
    <div style={detailPanelStyle}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <StatusBadge status={phase.status} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{phase.weeks || ""}</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
          {phase.name}
        </div>
      </div>

      {phase.detail && (
        <p style={{
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.7,
          marginBottom: 16,
          borderLeft: `3px solid ${c.bar}`,
          paddingLeft: 12,
        }}>
          {phase.detail}
        </p>
      )}

      {(phase.steps || []).length > 0 && (
        <>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#94a3b8",
            marginBottom: 10,
          }}>
            Steps
          </div>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {phase.steps.map((step, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c.bar,
                  flexShrink: 0,
                  marginTop: 5,
                }} />
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BlueprintSection — two-column layout
// ─────────────────────────────────────────────

function BlueprintSection() {
  const { layers, lastUpdated, currentWeek, totalWeeks } = BLUEPRINT_STATE;
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);

  // Flatten all phases for lookup
  const allPhases = layers.flatMap((l) => l.phases);
  const selectedPhase = selectedPhaseId
    ? allPhases.find((p) => p.id === selectedPhaseId) || null
    : null;

  function handleSelectPhase(id) {
    setSelectedPhaseId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Week <strong style={{ color: "#0f172a" }}>{currentWeek}</strong> of {totalWeeks}
        </span>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Last updated: <strong style={{ color: "#0f172a" }}>{lastUpdated}</strong>
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "25% 75%",
        gap: 20,
        alignItems: "start",
      }}>
        {/* Left column — layer/phase list */}
        <div style={{ display: "grid", gap: 12 }}>
          {layers.map((layer) => (
            <LayerSection
              key={layer.id}
              layer={layer}
              selectedPhaseId={selectedPhaseId}
              onSelectPhase={handleSelectPhase}
            />
          ))}
        </div>

        {/* Right column — sticky detail panel */}
        <div style={{ position: "sticky", top: 24 }}>
          <DetailPanel phase={selectedPhase} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TimelineSection — full width, own section
// ─────────────────────────────────────────────

function TimelineSection() {
  const { layers, totalWeeks, currentWeek } = BLUEPRINT_STATE;
  const allPhases = layers.flatMap((l) => l.phases.filter((p) => p.weekStart != null));
  const nowPct = ((currentWeek - 1) / totalWeeks) * 100;

  const weekLabels = [];
  for (let w = 1; w <= totalWeeks; w += 2) {
    weekLabels.push(w);
  }

  const LABEL_W = 160;

  return (
    <div>
      {/* Week header */}
      <div style={{ position: "relative", marginLeft: LABEL_W, height: 20, marginBottom: 4 }}>
        {weekLabels.map((w) => (
          <div
            key={w}
            style={{
              position: "absolute",
              left: `${((w - 1) / totalWeeks) * 100}%`,
              fontSize: 10,
              color: "#94a3b8",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            W{w}
          </div>
        ))}
      </div>

      {/* Phase rows */}
      <div style={{ position: "relative", marginLeft: LABEL_W }}>
        {/* Now line */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${nowPct}%`,
          width: 2,
          background: "#f59e0b",
          zIndex: 2,
          pointerEvents: "none",
        }} />

        {allPhases.map((phase) => {
          const c = statusColors(phase.status);
          const leftPct = ((phase.weekStart - 1) / totalWeeks) * 100;
          const widthPct = ((phase.weekEnd - phase.weekStart) / totalWeeks) * 100;

          return (
            <div
              key={phase.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 5,
                position: "relative",
              }}
            >
              {/* Label — absolutely positioned to the left */}
              <div style={{
                position: "absolute",
                right: "100%",
                paddingRight: 10,
                width: LABEL_W,
                textAlign: "right",
                fontSize: 11,
                color: "#475569",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {phase.name}
              </div>

              {/* Track */}
              <div style={{
                position: "relative",
                width: "100%",
                height: 20,
                background: "#f1f5f9",
                borderRadius: 10,
              }}>
                <div style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.8)}%`,
                  top: 3,
                  bottom: 3,
                  borderRadius: 7,
                  background: c.bar,
                  opacity: 0.85,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: c.bar }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{s}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#f59e0b" }} />
          <span style={{ fontSize: 11, color: "#64748b" }}>now</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AdminBlueprintPage — root export
// ─────────────────────────────────────────────

export function AdminBlueprintPage({ onClose }) {
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerRowStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            System Blueprint
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
            Full build plan — layers, phases, and timeline
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close blueprint"
        >
          ×
        </button>
      </div>

      {/* Blueprint section */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Blueprint</div>
        <BlueprintSection />
      </div>

      {/* Timeline section — full width, separate */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Timeline</div>
        <TimelineSection />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────

const pageStyle = {
  display: "grid",
  gap: 32,
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const closeButtonStyle = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 16,
  width: 44,
  height: 44,
  fontSize: 22,
  cursor: "pointer",
  flexShrink: 0,
  lineHeight: 1,
};

const sectionStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: "20px 24px",
  background: "#fff",
  display: "grid",
  gap: 16,
};

const sectionLabelStyle = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  fontWeight: 700,
};

const detailPanelStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "18px 20px",
  background: "#fafbfd",
  minHeight: 200,
};
