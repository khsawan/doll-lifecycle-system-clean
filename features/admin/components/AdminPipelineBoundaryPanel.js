"use client";

export function AdminPipelineBoundaryPanel({
  onOpenContentStudio,
  styles,
}) {
  return (
    <div style={boundaryStackStyle}>
      <div style={styles.panelStyle}>
        <div>
          <div style={{ ...styles.sectionLabelStyle, marginBottom: 6 }}>Pipeline Boundary</div>
          <div style={styles.titleStyle}>Content Work Lives in Content Studio</div>
        </div>

        <div style={styles.panelMetaStyle}>
          Use Content Studio for story, content pack, social, and generated experience content work
          for this doll.
        </div>

        <div style={styles.operatorHintStyle("muted")}>
          The Production Pipeline remains the control surface for stage progression. Return here when
          the content work is ready to review or progress.
        </div>

        <div style={boundaryActionRowStyle}>
          <button type="button" onClick={onOpenContentStudio} style={styles.primaryButton}>
            Open Content Studio
          </button>
        </div>
      </div>
    </div>
  );
}

const boundaryStackStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

const boundaryActionRowStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};
