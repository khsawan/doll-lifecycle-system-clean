"use client";

export function AdminOverviewSummaryPanel({
  statusItems,
  productionWorkflowComplete,
  productionReadyOverall,
  overviewBlockingItems,
  readinessMissingLabel,
  styles,
}) {
  return (
    <div style={overviewSummaryStyle}>
      <div style={statusPillRowStyle}>
        {statusItems.map((item) => (
          <div key={item.label} style={styles.statusPillStyle(item.tone)}>
            <div style={statusPillLabelStyle}>{item.label}</div>
            <div style={statusPillValueStyle}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Production Readiness</div>
        {productionWorkflowComplete ? (
          <div style={styles.operatorHintStyle("success")}>
            {productionReadyOverall
              ? "Production is complete."
              : "Production is complete. Complete all readiness sections before progressing the order."}
          </div>
        ) : (
          <div style={blockingListStyle}>
            {overviewBlockingItems.map((item) => (
              <div key={item.key} style={blockingItemStyle}>
                <div style={blockingItemLabelStyle}>{item.label}</div>
                <div style={blockingItemMetaStyle}>
                  {readinessMissingLabel(item.state.missing[0])}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const overviewSummaryStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

const statusPillRowStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const statusPillLabelStyle = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.75,
  fontWeight: 700,
};

const statusPillValueStyle = {
  fontWeight: 700,
};

const blockingListStyle = {
  display: "grid",
  gap: 10,
};

const blockingItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
};

const blockingItemLabelStyle = {
  fontWeight: 600,
};

const blockingItemMetaStyle = {
  color: "#9a3412",
  fontSize: 14,
  textAlign: "right",
};
