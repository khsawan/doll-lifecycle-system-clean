export function disabledFormControlStyle(baseStyle) {
  return {
    ...baseStyle,
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  };
}

export function disabledActionStyle(baseStyle) {
  return {
    ...baseStyle,
    opacity: 0.6,
    cursor: "not-allowed",
  };
}

export const labelStyle = {
  display: "block",
  fontSize: 14,
  color: "#475569",
  marginBottom: 8,
};

export const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

export const primaryButton = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

export const secondaryButton = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

export function sectionSaveButtonLabel(defaultLabel, isDirty, isSaving, hasSavedSnapshot) {
  if (isSaving) return "Saving...";
  if (!isDirty && hasSavedSnapshot) return "Saved";
  return defaultLabel;
}

export function sectionSaveButtonStyle(isDirty, isSaving, hasSavedSnapshot) {
  if (isSaving) {
    return {
      ...primaryButton,
      background: "#15803d",
      opacity: 0.85,
      cursor: "progress",
    };
  }

  if (!isDirty && hasSavedSnapshot) {
    return {
      ...secondaryButton,
      background: "#dcfce7",
      color: "#166534",
      opacity: 0.65,
      cursor: "not-allowed",
    };
  }

  return {
    ...primaryButton,
    background: "#166534",
  };
}

export function autoResizeTextarea(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export const dangerButton = {
  background: "#991b1b",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

export const hintStackStyle = {
  display: "grid",
  gap: 10,
};

export const inlineValidationHintStyle = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#64748b",
};

export const workflowFeedbackSlotStyle = {
  minHeight: 40,
  display: "grid",
  alignItems: "start",
};

export function workflowFeedbackMessageStyle(tone = "success", isVisible = true) {
  const baseStyle = {
    padding: "8px 10px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
    minHeight: 40,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? "visible" : "hidden",
    transition: "opacity 160ms ease, visibility 160ms ease",
  };

  if (tone === "error") {
    return {
      ...baseStyle,
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    };
  }

  if (tone === "muted") {
    return {
      ...baseStyle,
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      color: "#475569",
    };
  }

  return {
    ...baseStyle,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  };
}

export function operatorHintStyle(tone = "muted") {
  if (tone === "success") {
    return {
      background: "#ecfdf5",
      border: "1px solid #86efac",
      borderRadius: 14,
      padding: "10px 12px",
      color: "#166534",
      fontSize: 14,
      lineHeight: 1.6,
    };
  }

  if (tone === "warn") {
    return {
      background: "#fff7ed",
      border: "1px solid #fdba74",
      borderRadius: 14,
      padding: "10px 12px",
      color: "#9a3412",
      fontSize: 14,
      lineHeight: 1.6,
    };
  }

  return {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "10px 12px",
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.6,
  };
}

export function statusPillStyle(tone = "neutral") {
  if (tone === "success") {
    return {
      display: "grid",
      gap: 6,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid #86efac",
      background: "#ecfdf5",
      color: "#166534",
      minWidth: 160,
    };
  }

  if (tone === "warn") {
    return {
      display: "grid",
      gap: 6,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid #fdba74",
      background: "#fff7ed",
      color: "#9a3412",
      minWidth: 160,
    };
  }

  return {
    display: "grid",
    gap: 6,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    minWidth: 160,
  };
}

export const visualPlaceholderStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  minHeight: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "linear-gradient(135deg, #f5efe6 0%, #f1f5f9 100%)",
  padding: 20,
};

export const sectionLabelStyle = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  marginBottom: 12,
  fontWeight: 700,
};

export const subduedSectionLabelStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#a3b1c2",
  marginBottom: 10,
  fontWeight: 600,
};

export const mutedTextStyle = {
  color: "#64748b",
  lineHeight: 1.7,
  fontSize: 15,
  margin: 0,
};

export const contentCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

export const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};
