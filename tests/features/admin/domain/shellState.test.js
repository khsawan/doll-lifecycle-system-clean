import { describe, expect, it, vi } from "vitest";
import {
  buildAdminAuthenticatedShellState,
  buildAdminProductionSectionState,
  buildAdminSelectionSectionState,
} from "../../../../features/admin/domain/shellState";

describe("admin shell state domain helpers", () => {
  it("builds the production section with derived doll identity fields", () => {
    const state = buildAdminProductionSectionState({
      selected: {
        id: "doll-1",
        name: "Rosie",
        internal_id: "DOLL-001",
      },
      isProductionEditable: true,
      dollIdentityCollection: "Spring 2026",
      dollIdentityArtistDisplay: "Marie",
      dollIdentityArtistIsEmpty: false,
      currentWorkflowStageLabel: "Character",
      currentWorkflowStageStatus: "open",
      dollIdentityWorkflowState: "In progress",
      identity: { name: "Rosie" },
      setIdentity: () => {},
      hasImage: true,
      uploadImage: () => {},
      saveIdentity: () => {},
    });

    expect(state).toMatchObject({
      isProductionEditable: true,
      hasImage: true,
      dollIdentity: {
        name: "Rosie",
        internalId: "DOLL-001",
        collection: "Spring 2026",
        artistDisplay: "Marie",
        workflowStageLabel: "Character",
        workflowStageStatus: "open",
        workflowState: "In progress",
      },
    });
  });

  it("builds the selection section with the active selected id", () => {
    const setSelectedWorkspaceMode = () => {};
    const setActiveDepartment = () => {};
    const setActiveStageView = () => {};

    expect(
      buildAdminSelectionSectionState({
        selected: {
          id: "doll-1",
          name: "Rosie",
        },
        selectedIsArchived: false,
        selectedReadinessOverall: true,
        currentSelectedWorkspaceMode: "dashboard",
        setSelectedWorkspaceMode,
        selectedWorkspaceHeading: "Rosie Dashboard",
        selectedWorkspaceSummary: "Next step",
        currentDepartment: "Overview",
        setActiveDepartment,
        currentStageView: "overview",
        setActiveStageView,
      })
    ).toMatchObject({
      selectedId: "doll-1",
      selectedIsArchived: false,
      selectedReadinessOverall: true,
      currentSelectedWorkspaceMode: "dashboard",
      selectedWorkspaceHeading: "Rosie Dashboard",
      selectedWorkspaceSummary: "Next step",
      currentDepartment: "Overview",
      currentStageView: "overview",
    });
  });

  it("builds the authenticated shell state from grouped admin source states", () => {
    const clearStageActionWarning = vi.fn();
    const confirmStageActionWarning = vi.fn();
    const openDollWorkspace = vi.fn();
    const selectDoll = vi.fn();
    const saveIdentity = vi.fn();
    const uploadImage = vi.fn();

    const shellState = buildAdminAuthenticatedShellState({
      adminProtectionEnabled: true,
      handleLogout: vi.fn(),
      adminVersionLabel: "sha-123",
      selectedSlug: "rosie",
      publicUrl: "https://example.com/doll/rosie",
      publicPath: "/doll/rosie",
      operationsFilter: "needs_attention",
      setOperationsFilter: vi.fn(),
      operationsSort: "urgency",
      setOperationsSort: vi.fn(),
      contentSectionState: { storySaveState: { label: "Saved" } },
      browserActionsState: {
        copyToClipboard: vi.fn(),
        openPublicPage: vi.fn(),
      },
      catalogState: {
        themes: ["Unassigned"],
        dolls: [{ id: "doll-1", name: "Rosie" }],
        selected: {
          id: "doll-1",
          name: "Rosie",
          internal_id: "DOLL-001",
        },
        refreshCatalog: vi.fn(),
      },
      detailState: {
        identity: { name: "Rosie", image_url: "/rosie.png" },
        setIdentity: vi.fn(),
        order: { order_status: "new" },
        setOrder: vi.fn(),
        qrDataUrl: "data:image/png;base64,abc",
        commerceStatus: "draft",
        setCommerceStatus: vi.fn(),
      },
      identityEditorState: {
        saveIdentity,
        uploadImage,
      },
      selectionState: {
        selectDoll,
        openDollWorkspace,
        setSelectedWorkspaceMode: vi.fn(),
        setActiveDepartment: vi.fn(),
        setActiveStageView: vi.fn(),
      },
      workspaceViewState: {
        isCharacterEditable: true,
        effectiveCommerceStatus: "draft",
        effectiveAccessStatus: "generated",
        isGatewayEditable: true,
        dataQualityHints: ["Name is set"],
        digitalHints: ["QR ready"],
        hasQrIdentity: true,
        qrIsSensitive: false,
        qrSensitivityLabel: "Public",
        qrSensitivityText: "Safe to share",
        qrStatus: "Ready",
        savedQrUrl: "https://example.com/qr.png",
        qrReady: true,
        qrReadinessMessage: "Ready",
        qrWarningMessage: "Replace QR",
        operationsSummaryItems: [{ label: "Live", value: 1 }],
        filteredOperationsByDoll: [{ id: "doll-1" }],
        productionQueueGroups: [{ label: "Production", items: [] }],
        contentQueueGroups: [{ label: "Content", items: [] }],
        isProductionEditable: true,
        dollIdentityCollection: "Spring 2026",
        dollIdentityArtistDisplay: "Marie",
        dollIdentityArtistIsEmpty: false,
        currentWorkflowStageLabel: "Character",
        currentWorkflowStageStatus: "open",
        dollIdentityWorkflowState: "In progress",
        hasImage: true,
        selectedIsArchived: false,
        selectedReadiness: { overall: true },
        currentSelectedWorkspaceMode: "dashboard",
        selectedWorkspaceHeading: "Rosie Dashboard",
        selectedWorkspaceSummary: "Next step",
        currentDepartment: "Overview",
        currentStageView: "overview",
        workflowFeedback: { message: "Saved", tone: "success" },
        productionWorkflowComplete: false,
        overviewBlockingItems: ["Image"],
        contentOverviewItems: [{ label: "Story", value: "Ready" }],
        contentAssetCompleteness: [{ label: "Pages", complete: true }],
        contentPreviewHref: "/doll/rosie",
        contentManagementNextStepGuidance: "Generate content",
        selectedHasPlayActivityChoices: true,
        selectedEditablePlayActivity: { prompt: "Choose" },
        dashboardSummaryItems: [{ label: "Status", value: "Draft" }],
        dashboardNextStepMessage: "Open pipeline",
        dashboardRecommendedWorkspaceLabel: "Pipeline",
        dashboardRecommendedWorkspace: "pipeline",
        selectedPipelineState: { registered: { status: "completed" } },
        currentOpenPipelineStage: "character",
        showWorkflowGuidance: true,
        workflowGuidance: "Complete character",
        archiveWarningMessage: "Archive warning",
        deleteWarningMessage: "Delete warning",
        dangerNeedsTypedDelete: true,
      },
      commerceEditorState: {
        commerceSaving: false,
        saveCommerceStatus: vi.fn(),
        saveOrder: vi.fn(),
      },
      managedContentStoreState: {
        selectedContentManagement: { generation_status: "generated" },
        selectedGeneratedV1Content: { intro_script: "Hello" },
      },
      managedContentState: {
        managedContentGenerating: false,
        handleGenerateManagedContent: vi.fn(),
        handlePreviewManagedContent: vi.fn(),
        handleApproveManagedContent: vi.fn(),
        handlePublishManagedContent: vi.fn(),
        handleUnpublishManagedContent: vi.fn(),
        generatedContentEditState: { intro_script: false },
        generatedContentSavingState: { intro_script: false },
        introScriptDraft: "Hello",
        setIntroScriptDraft: vi.fn(),
        startIntroScriptEditing: vi.fn(),
        cancelIntroScriptEditing: vi.fn(),
        saveIntroScriptEdit: vi.fn(),
        storyPageDrafts: ["p1"],
        setStoryPageDrafts: vi.fn(),
        startStoryPageEditing: vi.fn(),
        cancelStoryPageEditing: vi.fn(),
        saveStoryPageEdit: vi.fn(),
        playActivityDraft: { prompt: "Play" },
        setPlayActivityDraft: vi.fn(),
        startPlayActivityEditing: vi.fn(),
        cancelPlayActivityEditing: vi.fn(),
        savePlayActivityEdit: vi.fn(),
        generateDraft: vi.fn(),
      },
      pipelineActionsState: {
        stageActionWarning: { type: "reopen" },
        confirmStageActionWarning,
        pipelineStageActionBusy: false,
        pipelineStageCompleting: "",
        completePipelineStage: vi.fn(),
        requestReopenPipelineStage: vi.fn(),
        pipelineStageReopening: "",
      },
      qrWorkflowState: {
        activateDigitalLayer: vi.fn(),
        generateQrCode: vi.fn(),
        requestQrRegeneration: vi.fn(),
        qrUploading: false,
        downloadQrCode: vi.fn(),
        downloadPrintCard: vi.fn(),
        showQrRegenerateWarning: false,
        setShowQrRegenerateWarning: vi.fn(),
        confirmQrRegeneration: vi.fn(),
        printCardRef: { current: null },
      },
      dangerZoneState: {
        dangerAction: "delete",
        dangerLoading: false,
        dangerConfirmText: "DELETE",
        setDangerConfirmText: vi.fn(),
        requestArchiveDoll: vi.fn(),
        requestPermanentDelete: vi.fn(),
        cancelDangerAction: vi.fn(),
        archiveDoll: vi.fn(),
        deleteDollPermanently: vi.fn(),
      },
      clearStageActionWarning,
    });

    expect(shellState.catalog).toMatchObject({
      adminVersionLabel: "sha-123",
      dolls: [{ id: "doll-1", name: "Rosie" }],
    });
    expect(shellState.character.themes).toEqual(["Unassigned"]);
    expect(shellState.operations.openDollWorkspace).toBe(openDollWorkspace);
    expect(shellState.production.uploadImage).toBe(uploadImage);
    expect(shellState.selection.selectedId).toBe("doll-1");
    expect(shellState.stageAction.clearWarning).toBe(clearStageActionWarning);
    expect(shellState.stageAction.confirmWarning).toBe(confirmStageActionWarning);
    expect(shellState.workspace.selectedGeneratedV1Content).toEqual({
      intro_script: "Hello",
    });
    expect(shellState.content).toEqual({
      storySaveState: { label: "Saved" },
    });
  });
});
