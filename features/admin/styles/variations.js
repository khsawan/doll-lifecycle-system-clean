import { secondaryButton } from "./primitives";

export const storyVariationPanelStyle = {
  marginBottom: 20,
  display: "grid",
  gap: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 18,
};

export const storyVariationPanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  paddingBottom: 2,
};

export const storyVariationPanelTitleStyle = {
  fontSize: 17,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
  letterSpacing: "-0.01em",
};

export const storyVariationPanelHintStyle = {
  fontSize: 14,
  lineHeight: 1.6,
  color: "#64748b",
  maxWidth: 720,
};

export const storyVariationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

export function storyVariationCardStyle(isSelected = false) {
  return {
    background: isSelected ? "#f0fdf4" : "#ffffff",
    border: `1px solid ${isSelected ? "#22c55e" : "#dbe3ee"}`,
    borderRadius: 22,
    padding: 20,
    display: "grid",
    gap: 16,
    alignContent: "start",
    minWidth: 0,
    boxShadow: isSelected
      ? "0 12px 26px rgba(34, 197, 94, 0.12)"
      : "0 6px 16px rgba(15, 23, 42, 0.04)",
  };
}

export const storyVariationCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

export const storyVariationCardLabelStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.4,
};

export function storyVariationBadgeStyle(isSelected = false) {
  return {
    padding: "6px 11px",
    borderRadius: 999,
    background: isSelected ? "#dcfce7" : "#f8fafc",
    border: `1px solid ${isSelected ? "#4ade80" : "#dbe3ee"}`,
    color: isSelected ? "#166534" : "#64748b",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
}

export const storyVariationPreviewStyle = {
  margin: 0,
  color: "#334155",
  lineHeight: 1.7,
  fontSize: 14,
  whiteSpace: "pre-wrap",
};

export const contentPackVariationPreviewStackStyle = {
  display: "grid",
  gap: 14,
};

export const contentPackVariationPreviewBlockStyle = {
  display: "grid",
  gap: 6,
  alignContent: "start",
};

export const contentPackVariationPreviewLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

export function storyVariationActionStyle(isSelected = false) {
  if (isSelected) {
    return {
      ...secondaryButton,
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
      cursor: "default",
      width: "100%",
      fontWeight: 700,
    };
  }

  return {
    ...secondaryButton,
    width: "100%",
    background: "#eef2f7",
    fontWeight: 700,
  };
}

export const contentVariationPanelStyles = {
  panelStyle: storyVariationPanelStyle,
  panelHeaderStyle: storyVariationPanelHeaderStyle,
  panelTitleStyle: storyVariationPanelTitleStyle,
  panelHintStyle: storyVariationPanelHintStyle,
  gridStyle: storyVariationGridStyle,
  cardStyle: storyVariationCardStyle,
  cardHeaderStyle: storyVariationCardHeaderStyle,
  cardLabelStyle: storyVariationCardLabelStyle,
  badgeStyle: storyVariationBadgeStyle,
  actionStyle: storyVariationActionStyle,
};
