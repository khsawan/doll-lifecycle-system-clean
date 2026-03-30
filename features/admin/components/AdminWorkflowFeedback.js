"use client";

export function AdminWorkflowFeedback({ feedback, slotStyle, messageStyle }) {
  if (!feedback) {
    return null;
  }

  return (
    <div style={slotStyle}>
      <div
        aria-live="polite"
        role={feedback.tone === "error" ? "alert" : "status"}
        title={feedback.message}
        style={messageStyle(feedback.tone, true)}
      >
        {feedback.message}
      </div>
    </div>
  );
}
