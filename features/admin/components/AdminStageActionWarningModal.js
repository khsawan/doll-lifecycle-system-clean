"use client";

export function AdminStageActionWarningModal({
  warning,
  pipelineStageLabels,
  formatStatusToken,
  onCancel,
  onConfirm,
  primaryButton,
  secondaryButton,
}) {
  if (!warning) {
    return null;
  }

  const title =
    warning.type === "reopen" && warning.stage
      ? `Reopen ${pipelineStageLabels[warning.stage]}?`
      : "";

  const affectedStagesLabel =
    warning.type === "reopen" && warning.affectedStages?.length
      ? warning.affectedStages
          .map((stage) => pipelineStageLabels[stage] || formatStatusToken(stage))
          .join(", ")
      : "";

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-warning-title"
        style={modalStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div id="action-warning-title" style={titleStyle}>
          {title}
        </div>

        <div style={textStyle}>
          This will make this stage editable again and lock all downstream stages.
        </div>
        <div style={{ ...textStyle, marginTop: 10 }}>
          No data will be lost, but downstream progress will need to be revalidated.
        </div>

        {affectedStagesLabel ? (
          <div style={listStyle}>This will lock: {affectedStagesLabel}</div>
        ) : null}

        <div style={actionsStyle}>
          <button type="button" onClick={onCancel} style={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} style={primaryButton}>
            Confirm Reopen
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: 560,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)",
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 14,
};

const textStyle = {
  color: "#475569",
  lineHeight: 1.7,
  fontSize: 15,
};

const listStyle = {
  marginTop: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "12px 14px",
  color: "#334155",
  lineHeight: 1.6,
  fontSize: 14,
  fontWeight: 600,
};

const actionsStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 20,
};
