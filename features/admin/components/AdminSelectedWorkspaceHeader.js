"use client";

export function AdminSelectedWorkspaceHeader({
  selected,
  selectedIsArchived,
  archivedBadgeStyle,
  currentSelectedWorkspaceMode,
  selectedWorkspaceModeBadgeStyle,
  selectedWorkspaceHeading,
  selectedWorkspaceSummaryStyle,
  selectedWorkspaceSummary,
  managedContentGenerating,
  disabledActionStyle,
  secondaryButton,
  onGenerateDraft,
  onBackToDashboard,
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 28 }}>{selected.name}</h2>
          {selectedIsArchived ? <div style={archivedBadgeStyle}>Archived</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <div style={selectedWorkspaceModeBadgeStyle(currentSelectedWorkspaceMode)}>
            {selectedWorkspaceHeading}
          </div>
          <div style={selectedWorkspaceSummaryStyle}>{selectedWorkspaceSummary}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {currentSelectedWorkspaceMode === "content_studio" ? (
          <button
            onClick={onGenerateDraft}
            style={managedContentGenerating ? disabledActionStyle(secondaryButton) : secondaryButton}
            disabled={managedContentGenerating}
          >
            {managedContentGenerating ? "Generating..." : "Generate Content Draft"}
          </button>
        ) : null}
        {currentSelectedWorkspaceMode !== "dashboard" ? (
          <button onClick={onBackToDashboard} style={secondaryButton}>
            Back to Dashboard
          </button>
        ) : null}
      </div>
    </div>
  );
}
