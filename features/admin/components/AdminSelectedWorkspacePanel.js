"use client";

import { AdminSelectedWorkspaceHeader } from "./AdminSelectedWorkspaceHeader";
import { AdminWorkflowFeedback } from "./AdminWorkflowFeedback";

export function AdminSelectedWorkspacePanel({
  selected,
  selectedIsArchived,
  currentSelectedWorkspaceMode,
  selectedWorkspaceHeading,
  selectedWorkspaceSummary,
  managedContentGenerating,
  onGenerateDraft,
  onBackToDashboard,
  selectedWorkspaceContent,
  workflowFeedback,
  styles,
}) {
  return (
    <section style={workspacePanelStyle}>
      {selected ? (
        <>
          <AdminSelectedWorkspaceHeader
            selected={selected}
            selectedIsArchived={selectedIsArchived}
            archivedBadgeStyle={styles.archivedBadgeStyle}
            currentSelectedWorkspaceMode={currentSelectedWorkspaceMode}
            selectedWorkspaceModeBadgeStyle={styles.selectedWorkspaceModeBadgeStyle}
            selectedWorkspaceHeading={selectedWorkspaceHeading}
            selectedWorkspaceSummaryStyle={styles.selectedWorkspaceSummaryStyle}
            selectedWorkspaceSummary={selectedWorkspaceSummary}
            managedContentGenerating={managedContentGenerating}
            disabledActionStyle={styles.disabledActionStyle}
            secondaryButton={styles.secondaryButton}
            onGenerateDraft={onGenerateDraft}
            onBackToDashboard={onBackToDashboard}
          />
          {selectedWorkspaceContent}
        </>
      ) : (
        <>
          <AdminWorkflowFeedback
            feedback={workflowFeedback}
            slotStyle={styles.workflowFeedbackSlotStyle}
            messageStyle={styles.workflowFeedbackMessageStyle}
          />
          <div style={emptyWorkspaceStateStyle}>Create your first doll to begin.</div>
        </>
      )}
    </section>
  );
}

const workspacePanelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 28,
  padding: 22,
};

const emptyWorkspaceStateStyle = {
  color: "#64748b",
};
