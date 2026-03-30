"use client";

import { DEPARTMENTS, showLegacyDepartmentsNavigation } from "../constants/workflow";
import { AdminWorkflowFeedback } from "./AdminWorkflowFeedback";

export function AdminPipelineWorkspace({
  workflowFeedback,
  workflowFeedbackSlotStyle,
  workflowFeedbackMessageStyle,
  workflowHeaderStackStyle,
  workflowHeaderPanelStyle,
  pipelineStageSectionStyle,
  workflowSectionHeaderStyle,
  sectionLabelStyle,
  currentStageView,
  onSelectStageView,
  overviewViewButtonStyle,
  pipelineStageGridStyle,
  stages,
  selectedPipelineState,
  currentOpenPipelineStage,
  pipelineStageStateLabel,
  pipelineStageCardStyle,
  pipelineStageCardHeaderStyle,
  pipelineStageNumberStyle,
  pipelineStageStatusIconStyle,
  pipelineStageStatusIcon,
  pipelineStageNameStyle,
  pipelineStageActionRowStyle,
  onCompletePipelineStage,
  pipelineStageActionButtonStyle,
  pipelineStageActionBusy,
  pipelineStageCompleting,
  onRequestReopenPipelineStage,
  pipelineStageSecondaryActionButtonStyle,
  pipelineStageReopening,
  showWorkflowGuidance,
  workflowGuidanceRowStyle,
  workflowGuidanceLabelStyle,
  workflowGuidanceTextStyle,
  workflowGuidance,
  departmentsSectionStyle,
  departmentsRowStyle,
  currentDepartment,
  onSelectDepartment,
  departmentPillStyle,
  visibleStageContent,
}) {
  return (
    <>
      <div style={workflowHeaderStackStyle}>
        <div style={workflowHeaderPanelStyle}>
          <AdminWorkflowFeedback
            feedback={workflowFeedback}
            slotStyle={workflowFeedbackSlotStyle}
            messageStyle={workflowFeedbackMessageStyle}
          />

          <div style={pipelineStageSectionStyle}>
            <div style={workflowSectionHeaderStyle}>
              <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Pipeline</div>
              <button
                type="button"
                onClick={() => onSelectStageView("overview")}
                style={overviewViewButtonStyle(currentStageView === "overview")}
              >
                Overview
              </button>
            </div>
            <div className="pipeline-stage-grid" style={pipelineStageGridStyle}>
              {stages.map((stage) => {
                const stageStatus = selectedPipelineState?.[stage.key]?.status || "locked";
                const isCurrentOpenStage = stage.key === currentOpenPipelineStage;
                const isCompletedStage = stageStatus === "completed";
                const isActiveStageView = currentStageView === stage.key;

                return (
                  <div
                    key={stage.value}
                    onClick={() => onSelectStageView(stage.key)}
                    style={pipelineStageCardStyle(stageStatus, isActiveStageView)}
                  >
                    <div style={pipelineStageCardHeaderStyle}>
                      <div style={pipelineStageNumberStyle(stageStatus)}>Step {stage.value}</div>
                      <div
                        aria-label={pipelineStageStateLabel(stageStatus)}
                        title={pipelineStageStateLabel(stageStatus)}
                        style={pipelineStageStatusIconStyle(stageStatus)}
                      >
                        {pipelineStageStatusIcon(stageStatus)}
                      </div>
                    </div>
                    <div style={pipelineStageNameStyle(stageStatus)}>{stage.label}</div>
                    {isCurrentOpenStage ? (
                      <div style={pipelineStageActionRowStyle}>
                        <button
                          type="button"
                          onClick={() => onCompletePipelineStage(stage.key)}
                          style={pipelineStageActionButtonStyle(
                            stageStatus,
                            pipelineStageActionBusy
                          )}
                          disabled={pipelineStageActionBusy}
                        >
                          {pipelineStageCompleting === stage.key ? "Completing..." : "Complete"}
                        </button>
                      </div>
                    ) : isCompletedStage ? (
                      <div style={pipelineStageActionRowStyle}>
                        <button
                          type="button"
                          onClick={() => onRequestReopenPipelineStage(stage.key)}
                          style={pipelineStageSecondaryActionButtonStyle(
                            stageStatus,
                            pipelineStageActionBusy
                          )}
                          disabled={pipelineStageActionBusy}
                        >
                          {pipelineStageReopening === stage.key ? "Reopening..." : "Reopen"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {showWorkflowGuidance ? (
            <div style={workflowGuidanceRowStyle}>
              <div style={workflowGuidanceLabelStyle}>Guidance</div>
              <div style={workflowGuidanceTextStyle(workflowGuidance.tone)}>
                {workflowGuidance.message}
              </div>
            </div>
          ) : null}
        </div>

        {showLegacyDepartmentsNavigation ? (
          <div style={departmentsSectionStyle}>
            <div style={{ ...sectionLabelStyle, marginBottom: 10 }}>Departments</div>
            <div style={departmentsRowStyle}>
              {DEPARTMENTS.map((department) => (
                <button
                  key={department}
                  type="button"
                  onClick={() => onSelectDepartment(department)}
                  style={departmentPillStyle(currentDepartment === department)}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {visibleStageContent}
    </>
  );
}
