export const operationsBoardStyle = {
  marginTop: 28,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 28,
  padding: 22,
  display: "grid",
  gap: 18,
};

export const operationsBoardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

export const operationsBoardMetaStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
  maxWidth: 360,
};

export const operationsControlsRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

export const operationsFilterPillRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

export function operationsFilterPillStyle(isActive = false) {
  return {
    padding: "9px 12px",
    borderRadius: 999,
    border: isActive ? "1px solid #0f172a" : "1px solid #cbd5e1",
    background: isActive ? "#0f172a" : "#ffffff",
    color: isActive ? "#ffffff" : "#334155",
    fontSize: 13,
    lineHeight: 1.3,
    fontWeight: 700,
    cursor: "pointer",
  };
}

export const operationsSortControlStyle = {
  display: "grid",
  gap: 6,
  minWidth: 180,
};

export const operationsSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

export const operationsSummaryCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#f8fafc",
  padding: "16px 18px",
  display: "grid",
  gap: 8,
};

export const operationsSummaryLabelStyle = {
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const operationsSummaryValueStyle = {
  color: "#0f172a",
  fontSize: 28,
  lineHeight: 1.1,
  fontWeight: 700,
};

export const operationsQueueGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  alignItems: "start",
};

export const operationsQueueColumnStyle = {
  display: "grid",
  gap: 14,
  alignContent: "start",
};

export const operationsQueueHeaderStyle = {
  display: "grid",
  gap: 6,
};

export const operationsQueueMetaStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

export const operationsBucketSectionStyle = {
  display: "grid",
  gap: 12,
};

export const operationsBucketHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

export const operationsBucketTitleStyle = {
  fontSize: 15,
  lineHeight: 1.4,
  fontWeight: 700,
  color: "#0f172a",
};

export const operationsBucketCountStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 34,
  height: 34,
  padding: "0 10px",
  borderRadius: 999,
  background: "#e2e8f0",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 700,
};

export const operationsCardListStyle = {
  display: "grid",
  gap: 12,
};

export function operationsCardStyle(urgency = "none", isSelected = false) {
  const borderColor =
    urgency === "high"
      ? "#fdba74"
      : urgency === "medium"
        ? "#cbd5e1"
        : urgency === "low"
          ? "#d7e8dc"
          : "#e2e8f0";

  return {
    border: isSelected ? "2px solid #0f172a" : `1px solid ${borderColor}`,
    borderRadius: 22,
    background: "#ffffff",
    padding: 18,
    display: "grid",
    gap: 12,
    boxShadow: isSelected ? "0 0 0 2px rgba(15, 23, 42, 0.08)" : "none",
  };
}

export const operationsCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
};

export const operationsCardNameStyle = {
  color: "#0f172a",
  fontSize: 18,
  lineHeight: 1.2,
  fontWeight: 700,
};

export const operationsCardMetaStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
  marginTop: 4,
};

export const operationsBadgeRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

export function operationsBucketBadgeStyle(type = "production") {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "7px 10px",
    background: type === "production" ? "#eef2ff" : "#ecfdf5",
    color: type === "production" ? "#0f172a" : "#166534",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 700,
  };
}

export function operationsUrgencyBadgeStyle(urgency = "none") {
  if (urgency === "high") {
    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "7px 10px",
      background: "#fff7ed",
      color: "#9a3412",
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
    };
  }

  if (urgency === "medium") {
    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "7px 10px",
      background: "#eff6ff",
      color: "#1d4ed8",
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
    };
  }

  if (urgency === "low") {
    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "7px 10px",
      background: "#ecfdf5",
      color: "#166534",
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "7px 10px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 700,
  };
}

export const operationsActionLabelStyle = {
  color: "#64748b",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
};

export const operationsActionTextStyle = {
  color: "#0f172a",
  fontSize: 18,
  lineHeight: 1.45,
  fontWeight: 700,
};

export const operationsReasonTextStyle = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.6,
};

export const operationsCardActionRowStyle = {
  display: "flex",
  justifyContent: "flex-start",
};

export const operationsEmptyStateStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 22,
  background: "#f8fafc",
  padding: 18,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};
