"use client";

import { AdminWorkflowFeedback } from "./AdminWorkflowFeedback";

export function AdminDashboardWorkspace({
  workflowFeedback,
  workflowFeedbackSlotStyle,
  workflowFeedbackMessageStyle,
  dashboardSummaryItems,
  dashboardSummaryGridStyle,
  dashboardSummaryCardStyle,
  dashboardSummaryLabelStyle,
  dashboardSummaryValueStyle,
  dashboardSummaryMetaStyle,
  dashboardNextStepCardStyle,
  dashboardNextStepLabelStyle,
  dashboardNextStepTextStyle,
  dashboardNextStepMessage,
  dashboardRecommendedWorkspaceLabel,
  dashboardNextStepHintStyle,
  dashboardActionGridStyle,
  dashboardActionCardStyle,
  dashboardRecommendedWorkspace,
  dashboardActionLabelStyle,
  dashboardActionTitleStyle,
  dashboardActionDescriptionStyle,
  dashboardActionBadgeStyle,
  onOpenPipelineWorkspace,
  onOpenContentStudioWorkspace,
}) {
  return (
    <div style={dashboardWorkspaceStyle}>
      <AdminWorkflowFeedback
        feedback={workflowFeedback}
        slotStyle={workflowFeedbackSlotStyle}
        messageStyle={workflowFeedbackMessageStyle}
      />

      <div style={dashboardSummaryGridStyle}>
        {dashboardSummaryItems.map((item) => (
          <div key={item.key} style={dashboardSummaryCardStyle(item.tone)}>
            <div style={dashboardSummaryLabelStyle}>{item.label}</div>
            <div style={dashboardSummaryValueStyle}>{item.value}</div>
            <div style={dashboardSummaryMetaStyle}>{item.meta}</div>
          </div>
        ))}
      </div>

      <div style={dashboardNextStepCardStyle}>
        <div style={dashboardNextStepLabelStyle}>Next Step</div>
        <div style={dashboardNextStepTextStyle}>{dashboardNextStepMessage}</div>
        {dashboardRecommendedWorkspaceLabel ? (
          <div style={dashboardNextStepHintStyle}>
            Recommended workspace: {dashboardRecommendedWorkspaceLabel}
          </div>
        ) : null}
      </div>

      <div style={dashboardActionGridStyle}>
        <button
          onClick={onOpenPipelineWorkspace}
          style={dashboardActionCardStyle(dashboardRecommendedWorkspace === "pipeline")}
        >
          <div style={dashboardActionLabelStyle}>Workspace</div>
          <div style={dashboardActionTitleStyle}>Open Production Pipeline</div>
          <div style={dashboardActionDescriptionStyle}>
            Manage pipeline progression, readiness, digital activation, commerce, and downstream
            order work for this doll.
          </div>
          {dashboardRecommendedWorkspace === "pipeline" ? (
            <div style={dashboardActionBadgeStyle}>Recommended</div>
          ) : null}
        </button>

        <button
          onClick={onOpenContentStudioWorkspace}
          style={dashboardActionCardStyle(dashboardRecommendedWorkspace === "content_studio")}
        >
          <div style={dashboardActionLabelStyle}>Workspace</div>
          <div style={dashboardActionTitleStyle}>Open Content Studio</div>
          <div style={dashboardActionDescriptionStyle}>
            Manage content overview, approval, publishing status, and the Build 1 content
            operations for this doll.
          </div>
          {dashboardRecommendedWorkspace === "content_studio" ? (
            <div style={dashboardActionBadgeStyle}>Recommended</div>
          ) : null}
        </button>
      </div>
    </div>
  );
}

const dashboardWorkspaceStyle = {
  display: "grid",
  gap: 20,
};
