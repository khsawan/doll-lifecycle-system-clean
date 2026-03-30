export const digitalCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

export const digitalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

export function digitalStatusPillStyle(isSensitive) {
  return {
    display: "inline-flex",
    alignItems: "center",
    background: isSensitive ? "#fff7ed" : "#ecfdf5",
    border: `1px solid ${isSensitive ? "#fdba74" : "#86efac"}`,
    color: isSensitive ? "#9a3412" : "#166534",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
  };
}

export const digitalInfoBoxStyle = {
  display: "grid",
  gap: 10,
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 18,
  padding: 16,
  marginBottom: 14,
};

export const digitalInfoTitleStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#64748b",
  fontWeight: 700,
};

export const digitalInfoTextStyle = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
};

export const slugRowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

export const slugCodeStyle = {
  display: "inline-block",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
};

export const urlCodeStyle = {
  display: "block",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  overflowWrap: "anywhere",
};

export const digitalGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

export const qrPlaceholderStyle = {
  margin: "14px 0 18px",
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "#f8fafc",
  padding: 20,
};

export function qrStatusBoxStyle(status) {
  if (status === "saved") {
    return {
      background: "#ecfdf5",
      border: "1px solid #86efac",
      borderRadius: 16,
      padding: 16,
      marginTop: 4,
    };
  }

  if (status === "generated") {
    return {
      background: "#fff7ed",
      border: "1px solid #fdba74",
      borderRadius: 16,
      padding: 16,
      marginTop: 4,
    };
  }

  return {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  };
}

export const qrWarningBoxStyle = {
  background: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: 18,
  padding: 16,
  marginTop: 14,
};

export const qrWarningTitleStyle = {
  fontWeight: 700,
  color: "#9a3412",
  marginBottom: 8,
};

export const qrWarningTextStyle = {
  color: "#7c2d12",
  lineHeight: 1.7,
  fontSize: 14,
};

export const dangerZoneStyle = {
  marginTop: 28,
  padding: 20,
  border: "1px solid #fecaca",
  background: "#fff7f7",
  borderRadius: 22,
};

export const dangerZoneLabelStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#b91c1c",
  marginBottom: 10,
  fontWeight: 700,
};

export const dangerZoneTitleStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: "#7f1d1d",
  marginBottom: 8,
};

export const dangerZoneTextStyle = {
  color: "#7f1d1d",
  lineHeight: 1.7,
  margin: "0 0 16px",
  fontSize: 15,
};

export const dangerConfirmCardStyle = {
  marginTop: 16,
  border: "1px solid #fca5a5",
  background: "#ffffff",
  borderRadius: 18,
  padding: 16,
};

export const dangerConfirmTitleStyle = {
  fontWeight: 700,
  color: "#7f1d1d",
  marginBottom: 8,
};

export const dangerConfirmTextStyle = {
  color: "#7f1d1d",
  lineHeight: 1.7,
  fontSize: 14,
};

export const dollIdentityCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: "18px 20px 16px",
  display: "grid",
  gap: 12,
  boxShadow: "none",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
};

export const dollIdentityHeaderRowStyle = {
  display: "grid",
  gap: 8,
};

export const dollIdentityLeadStyle = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gap: 0,
};

export const dollIdentityPrimaryStyle = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gap: 7,
};

export const dollIdentitySupportingInfoStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

export const dollIdentityIdStyle = {
  fontSize: 12.5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 600,
};

export const dollIdentityInfoDividerStyle = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: "rgba(100, 116, 139, 0.55)",
  flexShrink: 0,
};

export const dollIdentityNameStyle = {
  fontSize: 22,
  lineHeight: 1.15,
  fontWeight: 700,
  color: "#0f172a",
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const dollIdentityThemeStyle = {
  color: "#64748b",
  fontSize: 12.5,
  lineHeight: 1.35,
  fontWeight: 500,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const dollIdentityStatusStyle = {
  display: "grid",
  gap: 4,
  alignContent: "start",
  minWidth: 0,
};

export function dollIdentityStageBadgeStyle(status = "locked") {
  return {
    fontSize: 11,
    lineHeight: 1.25,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(100, 116, 139, 0.78)",
    fontWeight: 600,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

export function dollIdentityStatusStateStyle(status = "locked") {
  return {
    color: "#1e293b",
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 600,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

export const dollIdentityDividerStyle = {
  width: "100%",
  height: 1,
  background:
    "linear-gradient(90deg, rgba(148,163,184,0) 0%, rgba(148,163,184,0.28) 14%, rgba(148,163,184,0.28) 86%, rgba(148,163,184,0) 100%)",
};

export const dollIdentityMetaStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  alignItems: "start",
};

export const dollIdentityMetaStyle = {
  display: "grid",
  gap: 4,
  alignContent: "start",
  minWidth: 0,
};

export const dollIdentityMetaLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(100, 116, 139, 0.78)",
  fontWeight: 600,
};

export function dollIdentityMetaValueStyle(isEmpty = false) {
  return {
    color: isEmpty ? "#475569" : "#1e293b",
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 600,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

export const dollIdentityMetaHintStyle = {
  color: "rgba(100, 116, 139, 0.76)",
  fontSize: 11.5,
  lineHeight: 1.35,
};

export const printCardWrapperStyle = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};

export const printCardStyle = {
  width: 280,
  background: "#fffaf5",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 20,
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

export const printCardNameStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 8,
};

export const printCardTextStyle = {
  fontSize: 14,
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 16,
};

export const printCardQrStyle = {
  width: 180,
  height: 180,
  objectFit: "contain",
  borderRadius: 16,
  background: "#ffffff",
  padding: 10,
  border: "1px solid #e5e7eb",
};

export const printCardBrandStyle = {
  marginTop: 14,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};
