import {
  disabledActionStyle,
  inputStyle,
  primaryButton,
  secondaryButton,
} from "./primitives";

export const archivedBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#475569",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 13,
  fontWeight: 700,
};

export const contentManagementWorkspaceStyle = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(320px, 1fr)",
  gap: 12,
  alignItems: "start",
};

export const contentManagementPanelStyle = {
  background: "#fafbfd",
  border: "1px solid #e8edf3",
  borderRadius: 22,
  padding: 18,
  display: "grid",
  gap: 14,
};

export const contentManagementPanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

export const contentManagementTitleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
};

export const contentManagementPanelMetaStyle = {
  color: "#6b7280",
  fontSize: 13,
  lineHeight: 1.5,
  maxWidth: 280,
};

export function selectedWorkspaceModeBadgeStyle(mode = "dashboard") {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    border:
      mode === "pipeline"
        ? "1px solid #cbd5e1"
        : mode === "content_studio"
          ? "1px solid #d7e8dc"
          : "1px solid #dbe2ea",
    background:
      mode === "pipeline"
        ? "#f8fafc"
        : mode === "content_studio"
          ? "#fbfefc"
          : "#ffffff",
    color:
      mode === "pipeline"
        ? "#334155"
        : mode === "content_studio"
          ? "#355b48"
          : "#475569",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };
}

export const selectedWorkspaceSummaryStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

export const dashboardWorkspaceStyle = {
  marginTop: 14,
  display: "grid",
  gap: 14,
};

export const dashboardSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

export function dashboardSummaryCardStyle(tone = "neutral") {
  if (tone === "success") {
    return {
      display: "grid",
      gap: 6,
      padding: "16px 18px",
      borderRadius: 20,
      border: "1px solid #dfe9e2",
      background: "#f9fbfa",
      color: "#1f5137",
    };
  }

  if (tone === "warn") {
    return {
      display: "grid",
      gap: 6,
      padding: "16px 18px",
      borderRadius: 20,
      border: "1px solid #f1e4d5",
      background: "#fffaf4",
      color: "#8a4b16",
    };
  }

  return {
    display: "grid",
    gap: 6,
    padding: "16px 18px",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#334155",
  };
}

export const dashboardSummaryLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

export const dashboardSummaryValueStyle = {
  fontSize: 22,
  lineHeight: 1.15,
  fontWeight: 700,
};

export const dashboardSummaryMetaStyle = {
  fontSize: 13,
  lineHeight: 1.5,
};

export const dashboardNextStepCardStyle = {
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  borderRadius: 20,
  padding: "16px 18px",
  display: "grid",
  gap: 6,
};

export const dashboardNextStepLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

export const dashboardNextStepTextStyle = {
  color: "#0f172a",
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 600,
};

export const dashboardNextStepHintStyle = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.5,
};

export const dashboardActionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

export function dashboardActionCardStyle(isRecommended = false) {
  return {
    textAlign: "left",
    border: isRecommended ? "1px solid #0f172a" : "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 22,
    padding: 18,
    display: "grid",
    gap: 8,
    cursor: "pointer",
  };
}

export const dashboardActionLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

export const dashboardActionTitleStyle = {
  fontSize: 20,
  lineHeight: 1.2,
  fontWeight: 700,
  color: "#0f172a",
};

export const dashboardActionDescriptionStyle = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.6,
};

export const dashboardActionBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const contentManagementOverviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

export function contentManagementMetricCardStyle(tone = "neutral", isSubtleSignal = false) {
  if (tone === "success") {
    return {
      display: "grid",
      gap: 7,
      padding: "13px 15px",
      borderRadius: 18,
      border: isSubtleSignal ? "1px solid #d7e8dc" : "1px solid #dfe9e2",
      background: isSubtleSignal ? "#fbfefc" : "#f8fbf9",
      color: "#1f5137",
      minWidth: 0,
      alignContent: "start",
    };
  }

  if (tone === "warn") {
    return {
      display: "grid",
      gap: 7,
      padding: "13px 15px",
      borderRadius: 18,
      border: isSubtleSignal ? "1px solid #efe0cf" : "1px solid #f1e4d5",
      background: isSubtleSignal ? "#fffdfa" : "#fffaf4",
      color: "#8a4b16",
      minWidth: 0,
      alignContent: "start",
    };
  }

  return {
    display: "grid",
    gap: 7,
    padding: "13px 15px",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#fcfdff",
    color: "#334155",
    minWidth: 0,
    alignContent: "start",
  };
}

export function contentManagementMetricLabelStyle(tone = "neutral") {
  return {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 700,
    opacity: 1,
    color:
      tone === "success"
        ? "#355b48"
        : tone === "warn"
          ? "#7c4a15"
          : "#475569",
  };
}

export const contentManagementMetricValueStyle = {
  fontSize: 16,
  lineHeight: 1.3,
  fontWeight: 700,
  minWidth: 0,
};

export const contentManagementMetricMetaTextStyle = {
  fontSize: 13,
  lineHeight: 1.5,
};

export const contentManagementAssetListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 2,
};

export function contentManagementAssetBadgeStyle(isComplete = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    border: isComplete ? "1px solid #d7e8dc" : "1px solid #e2e8f0",
    background: isComplete ? "#f9fdf9" : "#ffffff",
    color: isComplete ? "#2f6a47" : "#64748b",
  };
}

export const contentManagementActionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

export const contentDepartmentSectionStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

export function contentDepartmentFieldsetStyle(isEditable = true) {
  return {
    border: "none",
    padding: 0,
    margin: 0,
    minInlineSize: 0,
    display: "grid",
    gap: 20,
    opacity: isEditable ? 1 : 0.84,
  };
}

export const contentDepartmentEditorStackStyle = {
  display: "grid",
  gap: 20,
};

export const contentStudioWorkspaceStackStyle = {
  display: "grid",
  gap: 20,
};

export const contentStudioDraftSectionStyle = {
  marginTop: 14,
  display: "grid",
  gap: 14,
};

export const contentStudioDraftHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

export const contentStudioDraftGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 14,
};

export const contentStudioStoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

export const contentStudioReadonlyFieldStyle = {
  ...inputStyle,
  background: "#f8fafc",
  color: "#334155",
  resize: "none",
};

export const contentStudioSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

export const contentStudioSectionActionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

export const contentStudioFieldStackStyle = {
  display: "grid",
  gap: 14,
};

export const contentStudioChoiceListStyle = {
  display: "grid",
  gap: 10,
  marginTop: 14,
};

export const contentStudioChoiceCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: "12px 14px",
  display: "grid",
  gap: 6,
};

export const contentStudioChoiceEditorCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: "12px 14px",
  display: "grid",
  gap: 12,
};

export const contentStudioChoiceLabelStyle = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

export const contentStudioChoiceResultStyle = {
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.6,
};

export const contentManagementGuidanceStyle = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
};

export const contentManagementGuidanceLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

export const contentManagementGuidanceTextStyle = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 500,
};

export function contentManagementActionButtonStyle(variant = "primary", isDisabled = false) {
  const baseStyle =
    variant === "secondary"
      ? {
          ...secondaryButton,
          width: "100%",
          padding: "12px 14px",
          fontSize: 14,
          fontWeight: 700,
        }
      : {
          ...primaryButton,
          width: "100%",
          padding: "12px 14px",
          fontSize: 14,
          fontWeight: 700,
        };

  return isDisabled ? disabledActionStyle(baseStyle) : baseStyle;
}

export function contentStudioSectionButtonStyle(variant = "secondary", isDisabled = false) {
  const baseStyle =
    variant === "primary"
      ? {
          ...primaryButton,
          padding: "10px 14px",
          fontSize: 14,
          borderRadius: 14,
        }
      : {
          ...secondaryButton,
          padding: "10px 14px",
          fontSize: 14,
          borderRadius: 14,
        };

  return isDisabled ? disabledActionStyle(baseStyle) : baseStyle;
}

export const versionFooterStyle = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid #e2e8f0",
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.6,
  textAlign: "left",
  overflowWrap: "anywhere",
};
