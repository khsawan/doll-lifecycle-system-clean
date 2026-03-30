import { primaryButton, secondaryButton } from "./primitives";

export const workflowHeaderStackStyle = {
  marginTop: 14,
  display: "grid",
  gap: 12,
};

export const workflowHeaderPanelStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 20,
  display: "grid",
  gap: 14,
};

export const workflowSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

export const pipelineProgressTrackStyle = {
  height: 8,
  background: "#e2e8f0",
  borderRadius: 999,
};

export const pipelineProgressFillStyle = {
  height: "100%",
  background: "#0f172a",
  borderRadius: 999,
};

export const pipelineStageGridStyle = {
  display: "grid",
  width: "100%",
  minWidth: 0,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 8,
  alignItems: "stretch",
  justifyItems: "stretch",
  justifyContent: "stretch",
  gridAutoRows: "1fr",
};

export const pipelineStageSectionStyle = {
  width: "100%",
  minWidth: 0,
  display: "grid",
};

export const pipelineStageActionRowStyle = {
  marginTop: 10,
};

export const pipelineStageCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

export function pipelineStageNumberStyle(status = "locked") {
  return {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 700,
    color:
      status === "open"
        ? "rgba(255, 255, 255, 0.74)"
        : status === "completed"
          ? "#15803d"
          : "#64748b",
  };
}

export function pipelineStageNameStyle(status = "locked") {
  return {
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.25,
    color:
      status === "open"
        ? "#ffffff"
        : status === "completed"
          ? "#166534"
          : "#0f172a",
  };
}

export function pipelineStageStatusIconStyle(status = "locked") {
  if (status === "completed") {
    return {
      width: 28,
      height: 28,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "#ffffff",
      color: "#166534",
      border: "1px solid #86efac",
      flexShrink: 0,
    };
  }

  if (status === "open") {
    return {
      width: 28,
      height: 28,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "rgba(255, 255, 255, 0.12)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      flexShrink: 0,
    };
  }

  return {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    flexShrink: 0,
  };
}

export function pipelineStageStatusIcon(status = "locked") {
  if (status === "completed") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M3.25 8.25 6.45 11.2 12.75 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "open") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M11.1 6V4.85A3.1 3.1 0 0 0 8 1.75a3.1 3.1 0 0 0-3.1 3.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="2.9"
          y="6"
          width="10.2"
          height="7.9"
          rx="2.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M4.9 6V4.85A3.1 3.1 0 0 1 8 1.75a3.1 3.1 0 0 1 3.1 3.1V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2.9"
        y="6"
        width="10.2"
        height="7.9"
        rx="2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export const departmentsSectionStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: "16px 20px",
};

export function overviewViewButtonStyle(isActive = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    border: isActive ? "1px solid #0f172a" : "1px solid #cbd5e1",
    background: isActive ? "#0f172a" : "#ffffff",
    color: isActive ? "#ffffff" : "#334155",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: "pointer",
  };
}

export const departmentsRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

export function departmentPillStyle(isActive = false) {
  return {
    padding: "12px 18px",
    borderRadius: 16,
    border: isActive ? "1px solid #0f172a" : "1px solid #cbd5e1",
    background: isActive ? "#0f172a" : "#fff",
    color: isActive ? "#fff" : "#0f172a",
    cursor: "pointer",
    fontSize: 15,
    minHeight: 48,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export const workflowGuidanceRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "baseline",
};

export const workflowGuidanceLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

export function workflowGuidanceTextStyle(tone = "muted") {
  return {
    color:
      tone === "success"
        ? "#166534"
        : tone === "warn"
          ? "#9a3412"
          : "#334155",
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: 500,
    flex: "1 1 0%",
    minWidth: 0,
  };
}

export function pipelineStageCardStyle(status = "locked", isActive = false) {
  const activeShadow =
    status === "completed"
      ? "0 0 0 2px rgba(22, 101, 52, 0.16)"
      : status === "open"
        ? "0 0 0 2px rgba(15, 23, 42, 0.18)"
        : "0 0 0 2px rgba(71, 85, 105, 0.14)";

  const baseStyle = {
    padding: "12px",
    borderRadius: 16,
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    gap: 8,
    width: "100%",
    minWidth: 0,
    maxWidth: "none",
    minHeight: 132,
    height: "100%",
    alignContent: "start",
    boxSizing: "border-box",
    cursor: "pointer",
    boxShadow: isActive ? activeShadow : "none",
    justifySelf: "stretch",
    alignSelf: "stretch",
  };

  if (status === "completed") {
    return {
      ...baseStyle,
      border: "1px solid #86efac",
      background: "#ecfdf5",
      color: "#166534",
    };
  }

  if (status === "open") {
    return {
      ...baseStyle,
      border: "1px solid #0f172a",
      background: "#0f172a",
      color: "#ffffff",
    };
  }

  return {
    ...baseStyle,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
  };
}

export function pipelineStageActionButtonStyle(status = "open", isBusy = false) {
  const baseStyle =
    status === "open"
      ? {
          width: "100%",
          background: "#ffffff",
          color: "#0f172a",
          border: "none",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }
      : {
          ...primaryButton,
          width: "100%",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
        };

  return isBusy
    ? {
        ...baseStyle,
        opacity: 0.72,
        cursor: "not-allowed",
      }
    : baseStyle;
}

export function pipelineStageSecondaryActionButtonStyle(status = "completed", isBusy = false) {
  const baseStyle =
    status === "completed"
      ? {
          width: "100%",
          background: "#ffffff",
          color: "#166534",
          border: "1px solid #86efac",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }
      : {
          ...secondaryButton,
          width: "100%",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
        };

  return isBusy
    ? {
        ...baseStyle,
        opacity: 0.72,
        cursor: "not-allowed",
      }
    : baseStyle;
}
