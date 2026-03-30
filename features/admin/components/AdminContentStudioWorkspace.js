"use client";

import { AdminWorkflowFeedback } from "./AdminWorkflowFeedback";

export function AdminContentStudioWorkspace({
  workflowFeedback,
  workflowFeedbackSlotStyle,
  workflowFeedbackMessageStyle,
  stackStyle,
  contentManagementWorkspaceContent,
  contentDepartmentContent,
  contentStudioGeneratedDraftContent,
}) {
  return (
    <div style={stackStyle}>
      <AdminWorkflowFeedback
        feedback={workflowFeedback}
        slotStyle={workflowFeedbackSlotStyle}
        messageStyle={workflowFeedbackMessageStyle}
      />
      {contentManagementWorkspaceContent}
      {contentDepartmentContent}
      {contentStudioGeneratedDraftContent}
    </div>
  );
}
