"use client";

import { useState } from "react";
import { BLUEPRINT_STATE } from "../data/blueprintState";

const STATUS_COLORS = {
  done:        { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", bar: "#22c55e" },
  "in-progress":{ bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", bar: "#3b82f6" },
  next:        { bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe", bar: "#8b5cf6" },
  planned:     { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", bar: "#94a3b8" },
  blocked:     { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", bar: "#ef4444" },
};

function statusColors(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.planned;
}

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

function PhaseRow({ phase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "12px 0",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 12,
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
          {phase.name}
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
          {phase.weeks || ""}
        </span>
        <StatusBadge status={phase.status} />
      </button>

      {expanded && (
        <div style={{ paddingBottom: 16, paddingLeft: 4 }}>
          {phase.detail && (
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 10, lineHeight: 1.6 }}>
              {phase.detail}
            </p>
          )}
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {(phase.steps || []).map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LayerSection({ layer }) {
  const c = statusColors(layer.status);
  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: 18,
      padding: "18px 20px",
      background: "#fff",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          {layer.title}
        </span>
        <StatusBadge status={layer.status} />
      </div>

      <div>
        {(layer.phases || []).map((phase) => (
          <PhaseRow key={phase.id} phase={phase} />
        ))}
      </div>
    </div>
  );
}

function BlueprintSection() {
  const { layers, lastUpdated, currentWeek, totalWeeks } = BLUEPRINT_STATE;
  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Week <strong style={{ color: "#0f172a" }}>{currentWeek}</strong> of {totalWeeks}
        </span>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Last updated: <strong style={{ color: "#0f172a" }}>{lastUpdated}</strong>
        </span>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {layers.map((layer) => (
          <LayerSection key={layer.id} layer={layer} />
        ))}
      </div>
    </div>
  );
}

function TimelineSection() {
  const { layers, totalWeeks, currentWeek } = BLUEPRINT_STATE;
  const allPhases = layers.flatMap((l) => l.phases.filter((p) => p.weekStart != null));
  const nowPct = ((currentWeek - 1) / totalWeeks) * 100;

  const weekLabels = [];
  for (let w = 1; w <= totalWeeks; w += 4) {
    weekLabels.push(w);
  }

  return (
    <div>
      {/* Week header */}
      <div style={{ display: "flex", marginLeft: 180, marginBottom: 6, position: "relative" }}>
        {weekLabels.map((w) => (
          <div
            key={w}
            style={{
              position: "absolute",
              left: `${((w - 1) / totalWeeks) * 100}%`,
              fontSize: 10,
              color: "#94a3b8",
              transform: "translateX(-50%)",
            }}
          >
            W{w}
          </div>
        ))}
      </div>

      {/* Phase rows */}
      <div style={{ position: "relative", marginLeft: 180 }}>
        {/* Now line */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${nowPct}%`,
          width: 2,
          background: "#f59e0b",
          zIndex: 2,
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
                marginBottom: 6,
                position: "relative",
              }}
            >
              {/* Label — sits left of the chart area */}
              <div style={{
                position: "absolute",
                right: "100%",
                paddingRight: 10,
                width: 180,
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
                height: 18,
                background: "#f1f5f9",
                borderRadius: 9,
              }}>
                {/* Bar */}
                <div style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 1)}%`,
                  top: 2,
                  bottom: 2,
                  borderRadius: 7,
                  background: c.bar,
                  opacity: 0.85,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
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

export function AdminBlueprintPage({ onClose }) {
  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            System Blueprint
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
            Full build plan — layers, phases, and timeline
          </p>
        </div>
        <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Close blueprint">
          ×
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Blueprint</div>
        <BlueprintSection />
      </div>

      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Timeline</div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 520 }}>
            <TimelineSection />
          </div>
        </div>
      </div>
    </div>
  );
}

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
