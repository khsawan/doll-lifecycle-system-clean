"use client";

import { useState } from "react";
import { PIPELINE_STAGE_LABELS } from "../../../lib/pipelineState";
import { STORY_TONES } from "../constants/content";
import { PRODUCTION_STAGES } from "../constants/workflow";
import { normalizeCommerceStatus } from "../domain/content";
import {
  buildOperationsBoardViewState,
  operationsPassiveEmptyStateText,
  operationsQueueEmptyStateText,
} from "../domain/operations";
import {
  formatStatusToken,
  getPipelineProgressPercent,
  pipelineStageStateLabel,
  readinessMissingLabel,
  statusLabel,
} from "../domain/workflow";
import { AdminAppShell } from "./AdminAppShell";
import { AdminBlueprintPage } from "./AdminBlueprintPage";
import { AdminCharacterPanel } from "./AdminCharacterPanel";
import { AdminCommercePanel } from "./AdminCommercePanel";
import { AdminContentPackEditorPanel } from "./AdminContentPackEditorPanel";
import { AdminContentManagementPanel } from "./AdminContentManagementPanel";
import { AdminContentStudioWorkspace } from "./AdminContentStudioWorkspace";
import { AdminDashboardWorkspace } from "./AdminDashboardWorkspace";
import { AdminDangerZonePanel } from "./AdminDangerZonePanel";
import { AdminDigitalIdentityPanel } from "./AdminDigitalIdentityPanel";
import { AdminGeneratedContentDraftEditor } from "./AdminGeneratedContentDraftEditor";
import { AdminNavigatorSidebar } from "./AdminNavigatorSidebar";
import { AdminOperationsBoard } from "./AdminOperationsBoard";
import { AdminOverviewSummaryPanel } from "./AdminOverviewSummaryPanel";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminPipelineBoundaryPanel } from "./AdminPipelineBoundaryPanel";
import { AdminPipelineWorkspace } from "./AdminPipelineWorkspace";
import { AdminProductionPanel } from "./AdminProductionPanel";
import { AdminSelectedWorkspacePanel } from "./AdminSelectedWorkspacePanel";
import { AdminSocialContentPanel } from "./AdminSocialContentPanel";
import { AdminStageActionWarningModal } from "./AdminStageActionWarningModal";
import { AdminStoryEditorPanel } from "./AdminStoryEditorPanel";
import {
  autoResizeTextarea,
  contentCardStyle,
  contentGridStyle,
  dangerButton,
  disabledActionStyle,
  disabledFormControlStyle,
  hintStackStyle,
  inlineValidationHintStyle,
  inputStyle,
  labelStyle,
  mutedTextStyle,
  operatorHintStyle,
  primaryButton,
  sectionLabelStyle,
  sectionSaveButtonStyle,
  secondaryButton,
  statusPillStyle,
  subduedSectionLabelStyle,
  visualPlaceholderStyle,
  workflowFeedbackMessageStyle,
  workflowFeedbackSlotStyle,
} from "../styles/primitives";
import {
  contentVariationPanelStyles,
  contentPackVariationPreviewBlockStyle,
  contentPackVariationPreviewLabelStyle,
  contentPackVariationPreviewStackStyle,
  storyVariationPreviewStyle,
} from "../styles/variations";
import {
  operationsActionLabelStyle,
  operationsActionTextStyle,
  operationsBadgeRowStyle,
  operationsBoardHeaderStyle,
  operationsBoardMetaStyle,
  operationsBoardStyle,
  operationsBucketBadgeStyle,
  operationsBucketCountStyle,
  operationsBucketHeaderStyle,
  operationsBucketSectionStyle,
  operationsBucketTitleStyle,
  operationsCardActionRowStyle,
  operationsCardHeaderStyle,
  operationsCardListStyle,
  operationsCardMetaStyle,
  operationsCardNameStyle,
  operationsCardStyle,
  operationsControlsRowStyle,
  operationsEmptyStateStyle,
  operationsFilterPillRowStyle,
  operationsFilterPillStyle,
  operationsQueueColumnStyle,
  operationsQueueGridStyle,
  operationsQueueHeaderStyle,
  operationsQueueMetaStyle,
  operationsReasonTextStyle,
  operationsSortControlStyle,
  operationsSummaryCardStyle,
  operationsSummaryGridStyle,
  operationsSummaryLabelStyle,
  operationsSummaryValueStyle,
  operationsUrgencyBadgeStyle,
} from "../styles/operations";
import {
  departmentPillStyle,
  departmentsRowStyle,
  departmentsSectionStyle,
  overviewViewButtonStyle,
  pipelineProgressFillStyle,
  pipelineProgressTrackStyle,
  pipelineStageActionButtonStyle,
  pipelineStageActionRowStyle,
  pipelineStageCardHeaderStyle,
  pipelineStageCardStyle,
  pipelineStageGridStyle,
  pipelineStageNameStyle,
  pipelineStageNumberStyle,
  pipelineStageSecondaryActionButtonStyle,
  pipelineStageSectionStyle,
  pipelineStageStatusIcon,
  pipelineStageStatusIconStyle,
  workflowGuidanceLabelStyle,
  workflowGuidanceRowStyle,
  workflowGuidanceTextStyle,
  workflowHeaderPanelStyle,
  workflowHeaderStackStyle,
  workflowSectionHeaderStyle,
} from "../styles/pipeline";
import {
  archivedBadgeStyle,
  contentDepartmentEditorStackStyle,
  contentDepartmentFieldsetStyle,
  contentDepartmentSectionStyle,
  contentManagementActionButtonStyle,
  contentManagementActionGridStyle,
  contentManagementAssetBadgeStyle,
  contentManagementAssetListStyle,
  contentManagementGuidanceLabelStyle,
  contentManagementGuidanceStyle,
  contentManagementGuidanceTextStyle,
  contentManagementMetricCardStyle,
  contentManagementMetricLabelStyle,
  contentManagementMetricMetaTextStyle,
  contentManagementMetricValueStyle,
  contentManagementOverviewGridStyle,
  contentManagementPanelHeaderStyle,
  contentManagementPanelMetaStyle,
  contentManagementPanelStyle,
  contentManagementTitleStyle,
  contentManagementWorkspaceStyle,
  contentStudioChoiceCardStyle,
  contentStudioChoiceEditorCardStyle,
  contentStudioChoiceLabelStyle,
  contentStudioChoiceListStyle,
  contentStudioChoiceResultStyle,
  contentStudioDraftGridStyle,
  contentStudioDraftHeaderStyle,
  contentStudioDraftSectionStyle,
  contentStudioFieldStackStyle,
  contentStudioReadonlyFieldStyle,
  contentStudioSectionActionsStyle,
  contentStudioSectionButtonStyle,
  contentStudioSectionHeaderStyle,
  contentStudioStoryGridStyle,
  contentStudioWorkspaceStackStyle,
  dashboardActionBadgeStyle,
  dashboardActionCardStyle,
  dashboardActionDescriptionStyle,
  dashboardActionGridStyle,
  dashboardActionLabelStyle,
  dashboardActionTitleStyle,
  dashboardNextStepCardStyle,
  dashboardNextStepHintStyle,
  dashboardNextStepLabelStyle,
  dashboardNextStepTextStyle,
  dashboardSummaryCardStyle,
  dashboardSummaryGridStyle,
  dashboardSummaryLabelStyle,
  dashboardSummaryMetaStyle,
  dashboardSummaryValueStyle,
  selectedWorkspaceModeBadgeStyle,
  selectedWorkspaceSummaryStyle,
  versionFooterStyle,
} from "../styles/workspaces";
import {
  dangerConfirmCardStyle,
  dangerConfirmTextStyle,
  dangerConfirmTitleStyle,
  dangerZoneLabelStyle,
  dangerZoneStyle,
  dangerZoneTextStyle,
  dangerZoneTitleStyle,
  digitalCardStyle,
  digitalGridStyle,
  digitalHeaderStyle,
  digitalInfoBoxStyle,
  digitalInfoTextStyle,
  digitalInfoTitleStyle,
  digitalStatusPillStyle,
  dollIdentityCardStyle,
  dollIdentityDividerStyle,
  dollIdentityHeaderRowStyle,
  dollIdentityIdStyle,
  dollIdentityInfoDividerStyle,
  dollIdentityLeadStyle,
  dollIdentityMetaHintStyle,
  dollIdentityMetaLabelStyle,
  dollIdentityMetaStripStyle,
  dollIdentityMetaStyle,
  dollIdentityMetaValueStyle,
  dollIdentityNameStyle,
  dollIdentityPrimaryStyle,
  dollIdentityStageBadgeStyle,
  dollIdentityStatusStateStyle,
  dollIdentityStatusStyle,
  dollIdentitySupportingInfoStyle,
  dollIdentityThemeStyle,
  printCardBrandStyle,
  printCardNameStyle,
  printCardQrStyle,
  printCardStyle,
  printCardTextStyle,
  printCardWrapperStyle,
  qrPlaceholderStyle,
  qrStatusBoxStyle,
  qrWarningBoxStyle,
  qrWarningTextStyle,
  qrWarningTitleStyle,
  slugCodeStyle,
  slugRowStyle,
  urlCodeStyle,
} from "../styles/detailPanels";

export function AdminAuthenticatedShell({ state }) {
  const [showBlueprint, setShowBlueprint] = useState(false);
  const {
    auth,
    catalog,
    character,
    commerce,
    content,
    danger,
    digital,
    operations,
    production,
    selection,
    stageAction,
    workspace,
  } = state;
  const overviewStatusItems = [
    {
      label: "Sellability",
      value: formatStatusToken(commerce.effectiveCommerceStatus),
      tone: "neutral",
    },
    {
      label: "Access",
      value: formatStatusToken(commerce.effectiveAccessStatus),
      tone: commerce.effectiveAccessStatus === "generated" ? "success" : "warn",
    },
  ];
  const operationsBoardView = buildOperationsBoardViewState(operations.filter);
  const productionDepartmentContent = (
    <AdminProductionPanel
      isEditable={production.isProductionEditable}
      dollIdentity={production.dollIdentity}
      identity={production.identity}
      setIdentity={production.setIdentity}
      hasImage={production.hasImage}
      onUploadImage={production.uploadImage}
      onSaveIdentity={production.saveIdentity}
      autoResizeTextarea={autoResizeTextarea}
      styles={{
        dollIdentityCardStyle,
        dollIdentityHeaderRowStyle,
        dollIdentityLeadStyle,
        dollIdentityPrimaryStyle,
        dollIdentityNameStyle,
        dollIdentitySupportingInfoStyle,
        dollIdentityIdStyle,
        dollIdentityInfoDividerStyle,
        dollIdentityThemeStyle,
        dollIdentityDividerStyle,
        dollIdentityMetaStripStyle,
        dollIdentityMetaStyle,
        dollIdentityMetaLabelStyle,
        dollIdentityMetaValueStyle,
        dollIdentityMetaHintStyle,
        dollIdentityStatusStyle,
        dollIdentityStageBadgeStyle,
        dollIdentityStatusStateStyle,
        digitalCardStyle,
        subduedSectionLabelStyle,
        visualPlaceholderStyle,
        inlineValidationHintStyle,
        contentCardStyle,
        labelStyle,
        inputStyle,
        primaryButton,
      }}
    />
  );
  const characterDepartmentContent = (
    <AdminCharacterPanel
      isEditable={character.isCharacterEditable}
      identity={character.identity}
      setIdentity={character.setIdentity}
      themes={character.themes}
      onSaveIdentity={character.saveIdentity}
      styles={{
        labelStyle,
        inputStyle,
        primaryButton,
      }}
    />
  );
  const contentDepartmentContent = (
    <div style={contentDepartmentSectionStyle}>
      <fieldset
        disabled={!content.isContentEditable}
        style={contentDepartmentFieldsetStyle(content.isContentEditable)}
      >
        <AdminStoryEditorPanel
          hasStoryContent={content.hasStoryContent}
          storyTone={content.storyTone}
          onStoryToneChange={content.setStoryTone}
          storyTones={STORY_TONES}
          onApplyTone={content.applyTone}
          storyGenerating={content.storyGenerating}
          onSaveStory={content.saveStory}
          saveButtonStyle={sectionSaveButtonStyle(
            content.storySaveState.dirty,
            content.storySaveState.saving,
            content.storySaveState.hasSavedSnapshot
          )}
          saveDisabled={content.storySaveState.disabled}
          saveLabel={content.storySaveState.label}
          variations={content.storyVariations}
          selectedVariationId={content.selectedStoryVariationId}
          onApplyVariationToEditor={content.applyStoryVariationToEditor}
          story={content.story}
          setStory={content.setStory}
          setSelectedVariationId={content.setSelectedStoryVariationId}
          styles={{
            hintStackStyle,
            operatorHintStyle,
            primaryButton,
            secondaryButton,
            inputStyle,
            labelStyle,
            storyVariationPreviewStyle,
            variationPanelStyles: contentVariationPanelStyles,
          }}
        />

        <div style={contentDepartmentEditorStackStyle}>
          <AdminContentPackEditorPanel
            hasContentAssets={content.hasContentAssets}
            onGenerateContentPack={content.generateContentPack}
            contentPackGenerating={content.contentPackGenerating}
            onSaveContentPack={content.saveContentPack}
            saveButtonStyle={sectionSaveButtonStyle(
              content.contentPackSaveState.dirty,
              content.contentPackSaveState.saving,
              content.contentPackSaveState.hasSavedSnapshot
            )}
            saveDisabled={content.contentPackSaveState.disabled}
            saveLabel={content.contentPackSaveState.label}
            variations={content.contentPackVariations}
            selectedVariationId={content.selectedContentPackVariationId}
            onApplyVariationToEditor={content.applyContentPackVariationToEditor}
            contentPack={content.contentPack}
            setContentPack={content.setContentPack}
            setSelectedVariationId={content.setSelectedContentPackVariationId}
            styles={{
              hintStackStyle,
              operatorHintStyle,
              primaryButton,
              contentPackVariationPreviewStackStyle,
              contentPackVariationPreviewBlockStyle,
              contentPackVariationPreviewLabelStyle,
              storyVariationPreviewStyle,
              variationPanelStyles: contentVariationPanelStyles,
              contentCardStyle,
              sectionLabelStyle,
              inputStyle,
              contentGridStyle,
            }}
          />

          <AdminSocialContentPanel
            onGenerateSocialContent={content.generateSocialContent}
            socialGenerating={content.socialGenerating}
            onSaveSocialContent={content.saveIdentity}
            saveButtonStyle={sectionSaveButtonStyle(
              content.socialSaveState.dirty,
              content.socialSaveState.saving,
              content.socialSaveState.hasSavedSnapshot
            )}
            saveDisabled={content.socialSaveState.disabled}
            saveLabel={content.socialSaveState.label}
            variations={content.socialVariations}
            selectedVariationId={content.selectedSocialVariationId}
            onApplyVariationToEditor={content.applySocialVariationToEditor}
            identity={content.identity}
            setIdentity={content.setIdentity}
            setSelectedVariationId={content.setSelectedSocialVariationId}
            styles={{
              contentCardStyle,
              sectionLabelStyle,
              primaryButton,
              contentPackVariationPreviewStackStyle,
              contentPackVariationPreviewBlockStyle,
              contentPackVariationPreviewLabelStyle,
              storyVariationPreviewStyle,
              variationPanelStyles: contentVariationPanelStyles,
              labelStyle,
              inputStyle,
            }}
          />
        </div>
      </fieldset>
    </div>
  );
  const digitalDepartmentContent = (
    <AdminDigitalIdentityPanel
      selectedSlug={digital.selectedSlug}
      onCopySlug={() => digital.copyToClipboard(digital.selectedSlug, "Slug copied.")}
      dataQualityHints={digital.dataQualityHints}
      digitalHints={digital.digitalHints}
      hasQrIdentity={digital.hasQrIdentity}
      qrIsSensitive={digital.qrIsSensitive}
      qrSensitivityLabel={digital.qrSensitivityLabel}
      publicUrl={digital.publicUrl}
      publicPath={digital.publicPath}
      qrSensitivityText={digital.qrSensitivityText}
      qrDataUrl={digital.qrDataUrl}
      selectedName={selection.selected?.name || ""}
      qrStatus={digital.qrStatus}
      onPrepareDigitalIdentity={digital.activateDigitalLayer}
      isGatewayEditable={commerce.isGatewayEditable}
      savedQrUrl={digital.savedQrUrl}
      onGenerateQr={digital.generateQrCode}
      onRequestQrRegeneration={digital.requestQrRegeneration}
      qrUploading={digital.qrUploading}
      qrReady={digital.qrReady}
      onOpenPublicPage={() => digital.openPublicPage(digital.publicUrl)}
      onCopyPublicUrl={() => digital.copyToClipboard(digital.publicUrl, "Public URL copied.")}
      onDownloadQr={digital.downloadQrCode}
      onDownloadPrintCard={digital.downloadPrintCard}
      qrReadinessMessage={digital.qrReadinessMessage}
      showQrRegenerateWarning={digital.showQrRegenerateWarning}
      onCancelQrRegenerateWarning={() => digital.setShowQrRegenerateWarning(false)}
      qrWarningMessage={digital.qrWarningMessage}
      onConfirmQrRegeneration={digital.confirmQrRegeneration}
      printCardRef={digital.printCardRef}
      identityName={digital.identity.name}
      identityImageUrl={digital.identity.image_url}
      hasImage={production.hasImage}
      onUploadImage={production.uploadImage}
      styles={{
        digitalCardStyle,
        sectionLabelStyle,
        slugRowStyle,
        slugCodeStyle,
        secondaryButton,
        hintStackStyle,
        operatorHintStyle,
        digitalGridStyle,
        digitalHeaderStyle,
        mutedTextStyle,
        digitalStatusPillStyle,
        digitalInfoBoxStyle,
        digitalInfoTitleStyle,
        urlCodeStyle,
        digitalInfoTextStyle,
        qrPlaceholderStyle,
        qrStatusBoxStyle,
        primaryButton,
        disabledActionStyle,
        dangerButton,
        qrWarningBoxStyle,
        qrWarningTitleStyle,
        qrWarningTextStyle,
        printCardWrapperStyle,
        printCardStyle,
        printCardNameStyle,
        printCardTextStyle,
        printCardQrStyle,
        printCardBrandStyle,
        visualPlaceholderStyle,
      }}
    />
  );
  const commerceDepartmentContent = (
    <AdminCommercePanel
      commerceStatus={commerce.commerceStatus}
      onCommerceStatusChange={(value) => {
        commerce.setCommerceStatus(normalizeCommerceStatus(value));
      }}
      isGatewayEditable={commerce.isGatewayEditable}
      commerceSaving={commerce.commerceSaving}
      saveCommerceStatus={commerce.saveCommerceStatus}
      order={commerce.order}
      onOrderChange={commerce.setOrder}
      saveOrder={commerce.saveOrder}
      styles={{
        contentCardStyle,
        sectionLabelStyle,
        inputStyle,
        disabledFormControlStyle,
        inlineValidationHintStyle,
        primaryButton,
        disabledActionStyle,
      }}
    />
  );
  const dangerZoneDepartmentContent = (
    <AdminDangerZonePanel
      dangerAction={danger.dangerAction}
      dangerLoading={danger.dangerLoading}
      archiveWarningMessage={danger.archiveWarningMessage}
      deleteWarningMessage={danger.deleteWarningMessage}
      dangerNeedsTypedDelete={danger.dangerNeedsTypedDelete}
      dangerConfirmText={danger.dangerConfirmText}
      onDangerConfirmTextChange={danger.setDangerConfirmText}
      requestArchiveDoll={danger.requestArchiveDoll}
      requestPermanentDelete={danger.requestPermanentDelete}
      cancelDangerAction={danger.cancelDangerAction}
      archiveDoll={danger.archiveDoll}
      deleteDollPermanently={danger.deleteDollPermanently}
      styles={{
        dangerZoneStyle,
        dangerZoneLabelStyle,
        dangerZoneTitleStyle,
        dangerZoneTextStyle,
        dangerConfirmCardStyle,
        dangerConfirmTitleStyle,
        dangerConfirmTextStyle,
        secondaryButton,
        primaryButton,
        dangerButton,
        labelStyle,
        inputStyle,
      }}
    />
  );
  const overviewSummaryContent = (
    <AdminOverviewSummaryPanel
      statusItems={overviewStatusItems}
      productionWorkflowComplete={workspace.productionWorkflowComplete}
      productionReadyOverall={selection.selectedReadinessOverall}
      overviewBlockingItems={workspace.overviewBlockingItems}
      readinessMissingLabel={readinessMissingLabel}
      styles={{
        statusPillStyle,
        contentCardStyle,
        sectionLabelStyle,
        operatorHintStyle,
      }}
    />
  );
  const contentManagementWorkspaceContent = (
    <AdminContentManagementPanel
      contentOverviewItems={workspace.contentOverviewItems}
      contentAssetCompleteness={workspace.contentAssetCompleteness}
      managedContentGenerating={workspace.managedContentGenerating}
      contentPreviewHref={workspace.contentPreviewHref}
      selectedContentManagement={workspace.selectedContentManagement}
      contentManagementNextStepGuidance={workspace.contentManagementNextStepGuidance}
      onGenerateManagedContent={workspace.handleGenerateManagedContent}
      onPreviewManagedContent={workspace.handlePreviewManagedContent}
      onApproveManagedContent={workspace.handleApproveManagedContent}
      onPublishManagedContent={workspace.handlePublishManagedContent}
      onUnpublishManagedContent={workspace.handleUnpublishManagedContent}
      styles={{
        workspaceStyle: contentManagementWorkspaceStyle,
        panelStyle: contentManagementPanelStyle,
        panelHeaderStyle: contentManagementPanelHeaderStyle,
        sectionLabelStyle,
        titleStyle: contentManagementTitleStyle,
        panelMetaStyle: contentManagementPanelMetaStyle,
        overviewGridStyle: contentManagementOverviewGridStyle,
        metricCardStyle: contentManagementMetricCardStyle,
        metricLabelStyle: contentManagementMetricLabelStyle,
        metricValueStyle: contentManagementMetricValueStyle,
        metricMetaTextStyle: contentManagementMetricMetaTextStyle,
        assetListStyle: contentManagementAssetListStyle,
        assetBadgeStyle: contentManagementAssetBadgeStyle,
        actionGridStyle: contentManagementActionGridStyle,
        actionButtonStyle: contentManagementActionButtonStyle,
        guidanceStyle: contentManagementGuidanceStyle,
        guidanceLabelStyle: contentManagementGuidanceLabelStyle,
        guidanceTextStyle: contentManagementGuidanceTextStyle,
        operatorHintStyle,
      }}
    />
  );
  const contentStudioGeneratedDraftContent = (
    <AdminGeneratedContentDraftEditor
      generatedContentEditState={workspace.generatedContentEditState}
      generatedContentSavingState={workspace.generatedContentSavingState}
      introScriptDraft={workspace.introScriptDraft}
      setIntroScriptDraft={workspace.setIntroScriptDraft}
      selectedGeneratedV1Content={workspace.selectedGeneratedV1Content}
      startIntroScriptEditing={workspace.startIntroScriptEditing}
      cancelIntroScriptEditing={workspace.cancelIntroScriptEditing}
      saveIntroScriptEdit={workspace.saveIntroScriptEdit}
      storyPageDrafts={workspace.storyPageDrafts}
      setStoryPageDrafts={workspace.setStoryPageDrafts}
      startStoryPageEditing={workspace.startStoryPageEditing}
      cancelStoryPageEditing={workspace.cancelStoryPageEditing}
      saveStoryPageEdit={workspace.saveStoryPageEdit}
      playActivityDraft={workspace.playActivityDraft}
      setPlayActivityDraft={workspace.setPlayActivityDraft}
      startPlayActivityEditing={workspace.startPlayActivityEditing}
      cancelPlayActivityEditing={workspace.cancelPlayActivityEditing}
      savePlayActivityEdit={workspace.savePlayActivityEdit}
      selectedHasPlayActivityChoices={workspace.selectedHasPlayActivityChoices}
      selectedEditablePlayActivity={workspace.selectedEditablePlayActivity}
      styles={{
        sectionStyle: contentStudioDraftSectionStyle,
        headerStyle: contentStudioDraftHeaderStyle,
        sectionLabelStyle,
        titleStyle: contentManagementTitleStyle,
        panelMetaStyle: contentManagementPanelMetaStyle,
        gridStyle: contentStudioDraftGridStyle,
        contentCardStyle,
        sectionHeaderStyle: contentStudioSectionHeaderStyle,
        labelStyle,
        sectionActionsStyle: contentStudioSectionActionsStyle,
        sectionButtonStyle: contentStudioSectionButtonStyle,
        inputStyle,
        readonlyFieldStyle: contentStudioReadonlyFieldStyle,
        storyGridStyle: contentStudioStoryGridStyle,
        fieldStackStyle: contentStudioFieldStackStyle,
        choiceListStyle: contentStudioChoiceListStyle,
        choiceEditorCardStyle: contentStudioChoiceEditorCardStyle,
        choiceCardStyle: contentStudioChoiceCardStyle,
        choiceLabelStyle: contentStudioChoiceLabelStyle,
        choiceResultStyle: contentStudioChoiceResultStyle,
        inlineValidationHintStyle,
      }}
    />
  );
  const dashboardWorkspaceContent = (
    <AdminDashboardWorkspace
      workflowFeedback={workspace.workflowFeedback}
      workflowFeedbackSlotStyle={workflowFeedbackSlotStyle}
      workflowFeedbackMessageStyle={workflowFeedbackMessageStyle}
      dashboardSummaryItems={workspace.dashboardSummaryItems}
      dashboardSummaryGridStyle={dashboardSummaryGridStyle}
      dashboardSummaryCardStyle={dashboardSummaryCardStyle}
      dashboardSummaryLabelStyle={dashboardSummaryLabelStyle}
      dashboardSummaryValueStyle={dashboardSummaryValueStyle}
      dashboardSummaryMetaStyle={dashboardSummaryMetaStyle}
      dashboardNextStepCardStyle={dashboardNextStepCardStyle}
      dashboardNextStepLabelStyle={dashboardNextStepLabelStyle}
      dashboardNextStepTextStyle={dashboardNextStepTextStyle}
      dashboardNextStepMessage={workspace.dashboardNextStepMessage}
      dashboardRecommendedWorkspaceLabel={workspace.dashboardRecommendedWorkspaceLabel}
      dashboardNextStepHintStyle={dashboardNextStepHintStyle}
      dashboardActionGridStyle={dashboardActionGridStyle}
      dashboardActionCardStyle={dashboardActionCardStyle}
      dashboardRecommendedWorkspace={workspace.dashboardRecommendedWorkspace}
      dashboardActionLabelStyle={dashboardActionLabelStyle}
      dashboardActionTitleStyle={dashboardActionTitleStyle}
      dashboardActionDescriptionStyle={dashboardActionDescriptionStyle}
      dashboardActionBadgeStyle={dashboardActionBadgeStyle}
      onOpenPipelineWorkspace={() => selection.setSelectedWorkspaceMode("pipeline")}
      onOpenContentStudioWorkspace={() =>
        selection.setSelectedWorkspaceMode("content_studio")
      }
    />
  );
  const overviewWorkspaceContent = (
    <>
      {overviewSummaryContent}
      {dangerZoneDepartmentContent}
    </>
  );
  const contentPipelineBoundaryContent = (
    <AdminPipelineBoundaryPanel
      onOpenContentStudio={() => selection.setSelectedWorkspaceMode("content_studio")}
      styles={{
        panelStyle: contentManagementPanelStyle,
        sectionLabelStyle,
        titleStyle: contentManagementTitleStyle,
        panelMetaStyle: contentManagementPanelMetaStyle,
        operatorHintStyle,
        primaryButton,
      }}
    />
  );
  const readyStageContent = <>{overviewSummaryContent}</>;
  const visibleStageContent =
    selection.currentStageView === "overview"
      ? overviewWorkspaceContent
      : selection.currentStageView === "registered"
        ? productionDepartmentContent
        : selection.currentStageView === "character"
          ? characterDepartmentContent
          : selection.currentStageView === "content"
            ? contentPipelineBoundaryContent
            : selection.currentStageView === "gateway"
              ? (
                  <>
                    {digitalDepartmentContent}
                    {commerceDepartmentContent}
                  </>
                )
              : selection.currentStageView === "ready"
                ? readyStageContent
                : null;
  const pipelineWorkspaceContent = (
    <AdminPipelineWorkspace
      workflowFeedback={workspace.workflowFeedback}
      workflowFeedbackSlotStyle={workflowFeedbackSlotStyle}
      workflowFeedbackMessageStyle={workflowFeedbackMessageStyle}
      workflowHeaderStackStyle={workflowHeaderStackStyle}
      workflowHeaderPanelStyle={workflowHeaderPanelStyle}
      pipelineStageSectionStyle={pipelineStageSectionStyle}
      workflowSectionHeaderStyle={workflowSectionHeaderStyle}
      sectionLabelStyle={sectionLabelStyle}
      currentStageView={selection.currentStageView}
      onSelectStageView={selection.setActiveStageView}
      overviewViewButtonStyle={overviewViewButtonStyle}
      pipelineStageGridStyle={pipelineStageGridStyle}
      stages={PRODUCTION_STAGES}
      selectedPipelineState={workspace.selectedPipelineState}
      currentOpenPipelineStage={workspace.currentOpenPipelineStage}
      pipelineStageStateLabel={pipelineStageStateLabel}
      pipelineStageCardStyle={pipelineStageCardStyle}
      pipelineStageCardHeaderStyle={pipelineStageCardHeaderStyle}
      pipelineStageNumberStyle={pipelineStageNumberStyle}
      pipelineStageStatusIconStyle={pipelineStageStatusIconStyle}
      pipelineStageStatusIcon={pipelineStageStatusIcon}
      pipelineStageNameStyle={pipelineStageNameStyle}
      pipelineStageActionRowStyle={pipelineStageActionRowStyle}
      onCompletePipelineStage={workspace.completePipelineStage}
      pipelineStageActionButtonStyle={pipelineStageActionButtonStyle}
      pipelineStageActionBusy={workspace.pipelineStageActionBusy}
      pipelineStageCompleting={workspace.pipelineStageCompleting}
      onRequestReopenPipelineStage={workspace.requestReopenPipelineStage}
      pipelineStageSecondaryActionButtonStyle={pipelineStageSecondaryActionButtonStyle}
      pipelineStageReopening={workspace.pipelineStageReopening}
      showWorkflowGuidance={workspace.showWorkflowGuidance}
      workflowGuidanceRowStyle={workflowGuidanceRowStyle}
      workflowGuidanceLabelStyle={workflowGuidanceLabelStyle}
      workflowGuidanceTextStyle={workflowGuidanceTextStyle}
      workflowGuidance={workspace.workflowGuidance}
      departmentsSectionStyle={departmentsSectionStyle}
      departmentsRowStyle={departmentsRowStyle}
      currentDepartment={selection.currentDepartment}
      onSelectDepartment={selection.setActiveDepartment}
      departmentPillStyle={departmentPillStyle}
      visibleStageContent={visibleStageContent}
    />
  );
  const contentStudioWorkspaceContent = (
    <AdminContentStudioWorkspace
      workflowFeedback={workspace.workflowFeedback}
      workflowFeedbackSlotStyle={workflowFeedbackSlotStyle}
      workflowFeedbackMessageStyle={workflowFeedbackMessageStyle}
      stackStyle={contentStudioWorkspaceStackStyle}
      contentManagementWorkspaceContent={contentManagementWorkspaceContent}
      contentDepartmentContent={contentDepartmentContent}
      contentStudioGeneratedDraftContent={contentStudioGeneratedDraftContent}
    />
  );
  const selectedWorkspaceContent =
    selection.currentSelectedWorkspaceMode === "pipeline"
      ? pipelineWorkspaceContent
      : selection.currentSelectedWorkspaceMode === "content_studio"
        ? contentStudioWorkspaceContent
        : dashboardWorkspaceContent;
  const selectedWorkspacePanelContent = (
    <AdminSelectedWorkspacePanel
      selected={selection.selected}
      selectedIsArchived={selection.selectedIsArchived}
      currentSelectedWorkspaceMode={selection.currentSelectedWorkspaceMode}
      selectedWorkspaceHeading={selection.selectedWorkspaceHeading}
      selectedWorkspaceSummary={selection.selectedWorkspaceSummary}
      managedContentGenerating={workspace.managedContentGenerating}
      onGenerateDraft={workspace.generateDraft}
      onBackToDashboard={() => selection.setSelectedWorkspaceMode("dashboard")}
      selectedWorkspaceContent={selectedWorkspaceContent}
      workflowFeedback={workspace.workflowFeedback}
      styles={{
        archivedBadgeStyle,
        selectedWorkspaceModeBadgeStyle,
        selectedWorkspaceSummaryStyle,
        disabledActionStyle,
        secondaryButton,
        workflowFeedbackSlotStyle,
        workflowFeedbackMessageStyle,
      }}
    />
  );
  const operationsBoardContent = (
    <AdminOperationsBoard
      operationsFilter={operations.filter}
      operationsSort={operations.sort}
      onChangeFilter={operations.setFilter}
      onChangeSort={operations.setSort}
      operationsSummaryItems={operations.operationsSummaryItems}
      showPassiveOperationsResults={operationsBoardView.showPassiveOperationsResults}
      passiveOperationsTitle={operationsBoardView.passiveOperationsTitle}
      passiveOperationsMeta={operationsBoardView.passiveOperationsMeta}
      filteredOperationsByDoll={operations.filteredOperationsByDoll}
      passiveEmptyStateText={operationsPassiveEmptyStateText(operations.filter)}
      showProductionQueue={operationsBoardView.showProductionQueue}
      productionQueueGroups={operations.productionQueueGroups}
      productionEmptyStateText={operationsQueueEmptyStateText("production", operations.filter)}
      showContentQueue={operationsBoardView.showContentQueue}
      contentQueueGroups={operations.contentQueueGroups}
      contentEmptyStateText={operationsQueueEmptyStateText("content", operations.filter)}
      selectedId={selection.selectedId}
      onOpenWorkspace={operations.openDollWorkspace}
      styles={{
        boardStyle: operationsBoardStyle,
        boardHeaderStyle: operationsBoardHeaderStyle,
        sectionLabelStyle,
        titleStyle: contentManagementTitleStyle,
        boardMetaStyle: operationsBoardMetaStyle,
        controlsRowStyle: operationsControlsRowStyle,
        filterPillRowStyle: operationsFilterPillRowStyle,
        filterPillStyle: operationsFilterPillStyle,
        sortControlStyle: operationsSortControlStyle,
        labelStyle,
        inputStyle,
        summaryGridStyle: operationsSummaryGridStyle,
        summaryCardStyle: operationsSummaryCardStyle,
        summaryLabelStyle: operationsSummaryLabelStyle,
        summaryValueStyle: operationsSummaryValueStyle,
        queueColumnStyle: operationsQueueColumnStyle,
        queueHeaderStyle: operationsQueueHeaderStyle,
        queueMetaStyle: operationsQueueMetaStyle,
        cardListStyle: operationsCardListStyle,
        emptyStateStyle: operationsEmptyStateStyle,
        queueGridStyle: operationsQueueGridStyle,
        bucketSectionStyle: operationsBucketSectionStyle,
        bucketHeaderStyle: operationsBucketHeaderStyle,
        bucketTitleStyle: operationsBucketTitleStyle,
        bucketCountStyle: operationsBucketCountStyle,
        cardStyle: operationsCardStyle,
        cardHeaderStyle: operationsCardHeaderStyle,
        cardNameStyle: operationsCardNameStyle,
        cardMetaStyle: operationsCardMetaStyle,
        urgencyBadgeStyle: operationsUrgencyBadgeStyle,
        badgeRowStyle: operationsBadgeRowStyle,
        bucketBadgeStyle: operationsBucketBadgeStyle,
        actionLabelStyle: operationsActionLabelStyle,
        actionTextStyle: operationsActionTextStyle,
        reasonTextStyle: operationsReasonTextStyle,
        cardActionRowStyle: operationsCardActionRowStyle,
        primaryButton,
      }}
    />
  );
  const navigatorSidebarContent = (
    <AdminNavigatorSidebar
      selectedReadinessOverall={selection.selectedReadinessOverall}
      refreshCatalog={catalog.refreshCatalog}
      secondaryButton={secondaryButton}
      dolls={catalog.dolls}
      selectedId={selection.selectedId}
      selectDoll={catalog.selectDoll}
      statusLabel={statusLabel}
      getPipelineProgressPercent={getPipelineProgressPercent}
      pipelineProgressTrackStyle={pipelineProgressTrackStyle}
      pipelineProgressFillStyle={pipelineProgressFillStyle}
      versionFooterStyle={versionFooterStyle}
      adminVersionLabel={catalog.adminVersionLabel}
    />
  );
  const actionWarningModal = (
    <AdminStageActionWarningModal
      warning={stageAction.warning}
      pipelineStageLabels={PIPELINE_STAGE_LABELS}
      formatStatusToken={formatStatusToken}
      onCancel={stageAction.clearWarning}
      onConfirm={stageAction.confirmWarning}
      primaryButton={primaryButton}
      secondaryButton={secondaryButton}
    />
  );

  return (
    <AdminAppShell
      header={
        <AdminPageHeader
          adminProtectionEnabled={auth.adminProtectionEnabled}
          onLogout={auth.handleLogout}
          onBlueprint={() => setShowBlueprint(true)}
          secondaryButton={secondaryButton}
        />
      }
      operationsBoard={showBlueprint ? null : operationsBoardContent}
      navigator={showBlueprint ? null : navigatorSidebarContent}
      workspacePanel={
        showBlueprint
          ? <AdminBlueprintPage onClose={() => setShowBlueprint(false)} />
          : selectedWorkspacePanelContent
      }
      modal={actionWarningModal}
    />
  );
}
