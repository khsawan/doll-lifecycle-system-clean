"use client";

export function AdminNavigatorSidebar({
  selectedReadinessOverall,
  refreshCatalog,
  secondaryButton,
  dolls,
  selectedId,
  selectDoll,
  statusLabel,
  getPipelineProgressPercent,
  pipelineProgressTrackStyle,
  pipelineProgressFillStyle,
  versionFooterStyle,
  adminVersionLabel,
}) {
  return (
    <section
      style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22 }}
      data-selected-readiness={selectedReadinessOverall ? "ready" : "incomplete"}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: 24 }}>Doll Navigator</h2>
          <div style={{ color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
            Selection only. Choose a doll to open its dashboard, production pipeline, or content
            studio workspace.
          </div>
        </div>

        <button onClick={refreshCatalog} style={secondaryButton}>
          Refresh List
        </button>
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 22, paddingTop: 18 }}>
        <div style={{ color: "#64748b", marginBottom: 14 }}>Dolls</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dolls.map((doll) => (
            <button
              key={doll.id}
              onClick={() => selectDoll(doll.id)}
              style={{
                textAlign: "left",
                border: selectedId === doll.id ? "2px solid #0f172a" : "1px solid #cbd5e1",
                background: doll.status === "archived" ? "#f8fafc" : "#fff",
                opacity: doll.status === "archived" ? 0.82 : 1,
                borderRadius: 20,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{doll.name}</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>
                    {doll.internal_id} - {doll.theme_name || "Unassigned"}
                  </div>
                </div>

                <div
                  style={{
                    background: "#eef2ff",
                    color: "#0f172a",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 14,
                  }}
                >
                  {statusLabel(doll.status)}
                </div>
              </div>

              <div style={{ ...pipelineProgressTrackStyle, marginTop: 14 }}>
                <div
                  style={{
                    ...pipelineProgressFillStyle,
                    width: `${getPipelineProgressPercent(doll)}%`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <footer style={versionFooterStyle}>{adminVersionLabel}</footer>
    </section>
  );
}
