import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  getCurrentOpenPipelineStage,
  withNormalizedPipelineState,
} from "../../../lib/pipelineState";
import {
  OPERATIONS_CONTENT_QUEUE_BUCKET_ORDER,
  OPERATIONS_PRODUCTION_QUEUE_BUCKET_ORDER,
} from "../constants/workflow";
import {
  buildEditablePlayActivityState,
  hasPlayActivityChoiceContent,
  normalizeCommerceStatus,
} from "./content";
import {
  deriveDollOperationsModel,
  matchesOperationsFilter,
  sortOperationsList,
} from "./operations";
import {
  formatStatusToken,
  getPipelineNormalizationTimestamp,
  isStageEditable,
  pipelineStageStateLabel,
} from "./workflow";

function buildFallbackOperationsRecord(doll = {}) {
  return {
    id: doll?.id || null,
    internal_id: doll?.internal_id || "",
    name: doll?.name || "Untitled doll",
    theme_name: doll?.theme_name || "Unassigned",
    status: doll?.status || "",
    updated_at: doll?.updated_at || "",
    created_at: doll?.created_at || "",
  };
}

function buildQueueGroups(filteredOperationsByDoll, operationsSort, attentionType, bucketOrder, key) {
  const operationsList = Array.isArray(filteredOperationsByDoll)
    ? filteredOperationsByDoll.filter(Boolean)
    : [];

  return bucketOrder
    .map((bucket) => ({
      bucket,
      items: sortOperationsList(
        operationsList.filter(
          (operation) =>
            operation?.attention_type === attentionType && operation?.[key] === bucket
        ),
        operationsSort
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function buildWorkflowViewState({
  selectedReadiness,
  qrReady,
  currentStageView,
  currentStageViewStatus,
}) {
  const readinessOverviewItems = [
    { key: "production", label: "Production", state: selectedReadiness.production },
    { key: "character", label: "Character", state: selectedReadiness.character },
    { key: "content", label: "Content", state: selectedReadiness.content },
    { key: "digital", label: "Digital", state: selectedReadiness.digital },
    { key: "commercial", label: "Product Commerce", state: selectedReadiness.commercial },
  ];
  const overviewBlockingItems = readinessOverviewItems.filter(
    (item) => !item.state.complete && item.key !== "commercial"
  );

  const globalWorkspaceNextStepMessage = (() => {
    if (!selectedReadiness.production.complete) {
      if (selectedReadiness.production.missing.includes("image_url")) {
        return "Next step: add the doll image in Production.";
      }

      return "Next step: complete Production to keep the pipeline moving.";
    }

    if (!selectedReadiness.character.complete) {
      return "Next step: complete Character to open Content.";
    }

    if (!selectedReadiness.content.complete) {
      if (selectedReadiness.content.missing.includes("story_content")) {
        return "Next step: complete Story in Content.";
      }

      if (selectedReadiness.content.missing.includes("content_pack")) {
        return "Next step: complete the Content Pack.";
      }

      if (selectedReadiness.content.missing.includes("social_content")) {
        return "Next step: complete social content.";
      }

      return "Next step: complete Content to open Gateway.";
    }

    if (!selectedReadiness.digital.complete) {
      if (selectedReadiness.digital.missing.includes("qr_code_url") && qrReady) {
        return "Next step: generate the QR code in Digital.";
      }

      return "Next step: finish the Digital setup.";
    }

    if (!selectedReadiness.commercial.complete) {
      return "Next step: set Product Commerce Status to Ready for Sale.";
    }

    return "All pipeline stages are complete.";
  })();

  const activeStageNextStepMessage = (() => {
    if (currentStageView === "registered" && !selectedReadiness.production.complete) {
      if (selectedReadiness.production.missing.includes("image_url")) {
        return "Add a doll image to complete production.";
      }

      if (selectedReadiness.production.missing.includes("color_palette")) {
        return "Add a color palette.";
      }

      if (selectedReadiness.production.missing.includes("notable_features")) {
        return "Describe the key physical features.";
      }

      return "Complete the remaining production details.";
    }

    if (currentStageView === "character" && !selectedReadiness.character.complete) {
      if (selectedReadiness.character.missing.includes("name")) {
        return "Add the character name.";
      }

      if (
        selectedReadiness.character.missing.includes("theme_name") ||
        selectedReadiness.character.missing.includes("universe_or_theme")
      ) {
        return "Assign a theme.";
      }

      if (selectedReadiness.character.missing.includes("personality_traits")) {
        return "Add personality traits.";
      }

      if (selectedReadiness.character.missing.includes("emotional_hook")) {
        return "Add the emotional hook.";
      }

      if (selectedReadiness.character.missing.includes("expression_feel")) {
        return "Add the expression feel.";
      }

      if (selectedReadiness.character.missing.includes("character_world")) {
        return "Add the character world.";
      }

      return "Complete the remaining character details.";
    }

    if (currentStageView === "content" && !selectedReadiness.content.complete) {
      if (selectedReadiness.content.missing.includes("story_content")) {
        return "Generate or write the story.";
      }

      if (selectedReadiness.content.missing.includes("content_pack")) {
        return "Complete the content pack.";
      }

      if (selectedReadiness.content.missing.includes("social_content")) {
        return "Complete social content.";
      }

      return "Finish the remaining content.";
    }

    if (currentStageView === "gateway") {
      if (selectedReadiness.digital.missing.includes("qr_code_url") && qrReady) {
        return "Generate the QR code in Digital.";
      }

      if (selectedReadiness.digital.missing.includes("slug")) {
        return "Add a public slug.";
      }

      if (selectedReadiness.digital.missing.includes("public_link")) {
        return "Prepare the digital identity.";
      }

      if (!selectedReadiness.commercial.complete) {
        return "Set Product Commerce Status to Ready for Sale.";
      }

      return "Finish the digital setup.";
    }

    if (currentStageView === "ready") {
      return selectedReadiness.overall
        ? "This doll is fully configured."
        : globalWorkspaceNextStepMessage;
    }

    return "";
  })();

  const workspaceNextStepMessage =
    activeStageNextStepMessage || globalWorkspaceNextStepMessage;
  const workflowGuidance = (() => {
    if (currentStageView === "overview") {
      return {
        tone: selectedReadiness.overall ? "success" : "muted",
        message: selectedReadiness.overall
          ? "All pipeline stages are complete."
          : globalWorkspaceNextStepMessage,
      };
    }

    if (currentStageViewStatus === "completed") {
      return {
        tone: currentStageView === "ready" && selectedReadiness.overall ? "success" : "muted",
        message:
          currentStageView === "ready" && selectedReadiness.overall
            ? "All pipeline stages are complete."
            : currentStageView === "gateway"
              ? "This pipeline stage is completed - reopen to edit. CRM order tracking remains editable."
              : "This pipeline stage is completed - reopen to edit.",
      };
    }

    if (currentStageViewStatus === "locked") {
      return {
        tone: "warn",
        message:
          currentStageView === "gateway"
            ? "This pipeline stage is locked - complete the previous pipeline stage to unlock it. CRM order tracking remains editable."
            : "This pipeline stage is locked - complete the previous pipeline stage to unlock it.",
      };
    }

    if (currentStageView === "ready") {
      return {
        tone: selectedReadiness.overall ? "success" : "muted",
        message: selectedReadiness.overall
          ? "All pipeline stages are complete."
          : globalWorkspaceNextStepMessage,
      };
    }

    return {
      tone: "muted",
      message: workspaceNextStepMessage,
    };
  })();

  return {
    readinessOverviewItems,
    overviewBlockingItems,
    globalWorkspaceNextStepMessage,
    activeStageNextStepMessage,
    workspaceNextStepMessage,
    workflowGuidance,
  };
}

export function buildContentAssetCompleteness({
  identityImageUrl,
  selectedImageUrl,
  qrDataUrl,
  selectedQrCodeUrl,
  story = {},
  selectedStoryMain,
  selectedStory,
}) {
  const items = [
    {
      key: "hero_image",
      label: "Hero image",
      complete: Boolean((identityImageUrl || selectedImageUrl || "").trim()),
    },
    {
      key: "story",
      label: "Story",
      complete: Boolean(
        story.teaser?.trim() ||
          story.mainStory?.trim() ||
          story.mini1?.trim() ||
          story.mini2?.trim() ||
          (typeof selectedStoryMain === "string" && selectedStoryMain.trim()) ||
          (typeof selectedStory === "string" && selectedStory.trim())
      ),
    },
    {
      key: "qr",
      label: "QR",
      complete: Boolean((qrDataUrl || selectedQrCodeUrl || "").trim()),
    },
  ];
  const completeCount = items.filter((item) => item.complete).length;

  return {
    items,
    completeCount,
    total: items.length,
    percent: Math.round((completeCount / items.length) * 100),
  };
}

export function buildContentManagementViewState({
  selectedContentManagement,
  contentAssetCompleteness,
}) {
  const contentOverviewItems = [
    {
      key: "generation_status",
      label: "Generation Status",
      value: formatStatusToken(selectedContentManagement.generation_status),
      meta:
        selectedContentManagement.generation_status === "generated"
          ? "Content generation marked complete"
          : "Awaiting Build 1 generation",
      tone: selectedContentManagement.generation_status === "generated" ? "success" : "neutral",
    },
    {
      key: "review_status",
      label: "Review Status",
      value: formatStatusToken(selectedContentManagement.review_status),
      meta:
        selectedContentManagement.review_status === "approved"
          ? "Approved in the management layer"
          : "Draft review state",
      tone: selectedContentManagement.review_status === "approved" ? "success" : "neutral",
    },
    {
      key: "publish_status",
      label: "Publish Status",
      value: formatStatusToken(selectedContentManagement.publish_status),
      meta:
        selectedContentManagement.publish_status === "live"
          ? "Marked live in Build 1"
          : "Currently hidden",
      tone: selectedContentManagement.publish_status === "live" ? "success" : "neutral",
    },
    {
      key: "asset_completeness",
      label: "Asset Completeness",
      value: `${contentAssetCompleteness.percent}%`,
      meta: `${contentAssetCompleteness.completeCount}/${contentAssetCompleteness.total} complete`,
      tone:
        contentAssetCompleteness.percent === 100
          ? "success"
          : contentAssetCompleteness.completeCount > 0
            ? "warn"
            : "neutral",
    },
  ];
  const contentManagementNextStepGuidance = (() => {
    if (selectedContentManagement.generation_status === "not_started") {
      return "Next step: Generate content to start production";
    }

    if (
      selectedContentManagement.generation_status === "generated" &&
      selectedContentManagement.review_status === "draft"
    ) {
      return "Next step: Review and approve the generated content";
    }

    if (
      selectedContentManagement.review_status === "approved" &&
      selectedContentManagement.publish_status === "hidden"
    ) {
      return "Next step: Publish the doll to make it live";
    }

    return "";
  })();
  const contentManagementStateSummary = [
    formatStatusToken(selectedContentManagement.generation_status),
    formatStatusToken(selectedContentManagement.review_status),
    formatStatusToken(selectedContentManagement.publish_status),
  ].join(" / ");

  return {
    contentOverviewItems,
    contentManagementNextStepGuidance,
    contentManagementStateSummary,
  };
}

export function buildOperationsBoardState({
  dolls,
  contentManagementByDoll,
  operationsFilter,
  operationsSort,
}) {
  const operationsByDoll = (Array.isArray(dolls) ? dolls : [])
    .filter((doll) => Boolean(doll) && typeof doll === "object")
    .map((doll) => {
      try {
        return deriveDollOperationsModel(doll, contentManagementByDoll?.[doll?.id]);
      } catch {
        return deriveDollOperationsModel(buildFallbackOperationsRecord(doll), undefined);
      }
    });

  const operationsSummaryItems = [
    {
      key: "total",
      label: "Total Dolls",
      value: operationsByDoll.length,
    },
    {
      key: "production_attention",
      label: "Production Attention",
      value: operationsByDoll.filter((operation) => operation.attention_type === "production")
        .length,
    },
    {
      key: "content_attention",
      label: "Content Attention",
      value: operationsByDoll.filter((operation) => operation.attention_type === "content").length,
    },
    {
      key: "ready_to_publish",
      label: "Ready to Publish",
      value: operationsByDoll.filter(
        (operation) => operation.content_bucket === "ready_to_publish"
      ).length,
    },
    {
      key: "live",
      label: "Live",
      value: operationsByDoll.filter((operation) => operation.content_bucket === "live").length,
    },
  ];

  const filteredOperationsByDoll = sortOperationsList(
    operationsByDoll.filter(
      (operation) => Boolean(operation) && matchesOperationsFilter(operation, operationsFilter)
    ),
    operationsSort
  );

  return {
    operationsByDoll,
    operationsSummaryItems,
    filteredOperationsByDoll,
    productionQueueGroups: buildQueueGroups(
      filteredOperationsByDoll,
      operationsSort,
      "production",
      OPERATIONS_PRODUCTION_QUEUE_BUCKET_ORDER,
      "production_bucket"
    ),
    contentQueueGroups: buildQueueGroups(
      filteredOperationsByDoll,
      operationsSort,
      "content",
      OPERATIONS_CONTENT_QUEUE_BUCKET_ORDER,
      "content_bucket"
    ),
  };
}

export function buildDashboardWorkspaceState({
  selectedReadiness,
  contentManagementNextStepGuidance,
  globalWorkspaceNextStepMessage,
  currentSelectedWorkspaceMode,
  currentWorkflowStageLabel,
  dollIdentityWorkflowState,
  selectedContentManagement,
  contentManagementStateSummary,
  contentAssetCompleteness,
}) {
  const dashboardRecommendedWorkspace = !selectedReadiness.overall
    ? "pipeline"
    : contentManagementNextStepGuidance
      ? "content_studio"
      : "";
  const dashboardRecommendedWorkspaceLabel =
    dashboardRecommendedWorkspace === "pipeline"
      ? "Open Production Pipeline"
      : dashboardRecommendedWorkspace === "content_studio"
        ? "Open Content Studio"
        : "";
  const dashboardNextStepMessage = !selectedReadiness.overall
    ? globalWorkspaceNextStepMessage
    : contentManagementNextStepGuidance || "Production and content are in a stable state.";
  const selectedWorkspaceHeading =
    currentSelectedWorkspaceMode === "pipeline"
      ? "Production Pipeline"
      : currentSelectedWorkspaceMode === "content_studio"
        ? "Content Studio"
        : "Selected Doll Dashboard";
  const selectedWorkspaceSummary =
    currentSelectedWorkspaceMode === "pipeline"
      ? `Current workflow: ${currentWorkflowStageLabel} / ${dollIdentityWorkflowState}`
      : currentSelectedWorkspaceMode === "content_studio"
        ? `Content status: ${contentManagementStateSummary}`
        : `Current workflow: ${currentWorkflowStageLabel} / ${dollIdentityWorkflowState}`;
  const dashboardSummaryItems = [
    {
      key: "production",
      label: "Production Pipeline",
      value: selectedReadiness.overall ? "Ready" : dollIdentityWorkflowState,
      meta: `Current focus: ${currentWorkflowStageLabel}`,
      tone: selectedReadiness.overall ? "success" : "warn",
    },
    {
      key: "content_management",
      label: "Content Management",
      value: formatStatusToken(selectedContentManagement.publish_status),
      meta: contentManagementStateSummary,
      tone:
        selectedContentManagement.publish_status === "live"
          ? "success"
          : selectedContentManagement.review_status === "approved" ||
              selectedContentManagement.generation_status === "generated"
            ? "warn"
            : "neutral",
    },
    {
      key: "asset_completeness",
      label: "Asset Completeness",
      value: `${contentAssetCompleteness.percent}%`,
      meta: `${contentAssetCompleteness.completeCount}/${contentAssetCompleteness.total} complete`,
      tone:
        contentAssetCompleteness.percent === 100
          ? "success"
          : contentAssetCompleteness.completeCount > 0
            ? "warn"
            : "neutral",
    },
  ];

  return {
    dashboardRecommendedWorkspace,
    dashboardRecommendedWorkspaceLabel,
    dashboardNextStepMessage,
    selectedWorkspaceHeading,
    selectedWorkspaceSummary,
    dashboardSummaryItems,
  };
}

export function buildSelectedReadinessState({
  selected,
  identity,
  story,
  contentPack,
  selectedSlug,
  publicPath,
  publicUrl,
  effectiveCommerceStatus,
}) {
  const productionMissing = [];
  if (!selected?.internal_id?.trim()) productionMissing.push("internal_id");
  if (!selected?.image_url?.trim()) productionMissing.push("image_url");
  if (!identity.color_palette?.trim()) productionMissing.push("color_palette");
  if (!identity.notable_features?.trim()) productionMissing.push("notable_features");

  const liveThemeName = identity.theme_name?.trim() || "";
  const savedThemeName = selected?.theme_name?.trim() || "";
  const hasLiveTheme = Boolean(liveThemeName) && liveThemeName.toLowerCase() !== "unassigned";
  const hasThemeAssignment =
    Boolean(selected?.universe_id) ||
    (Boolean(savedThemeName) && savedThemeName.toLowerCase() !== "unassigned") ||
    hasLiveTheme;

  const characterMissing = [];
  if (!identity.name?.trim()) characterMissing.push("name");
  if (!hasLiveTheme) characterMissing.push("theme_name");
  if (!hasThemeAssignment) characterMissing.push("universe_or_theme");
  if (!identity.personality_traits?.trim()) characterMissing.push("personality_traits");
  if (!identity.emotional_hook?.trim()) characterMissing.push("emotional_hook");
  if (!identity.expression_feel?.trim()) characterMissing.push("expression_feel");
  if (!identity.character_world?.trim()) characterMissing.push("character_world");

  const contentMissing = [];
  const hasRealStoryContent = Boolean(
    story.mainStory?.trim() ||
      (typeof selected?.story_main === "string" && selected.story_main.trim()) ||
      (typeof selected?.story === "string" && selected.story.trim())
  );
  const hasRealContentPack = Boolean(
    contentPack.caption?.trim() ||
      contentPack.hook?.trim() ||
      contentPack.blurb?.trim() ||
      contentPack.cta?.trim()
  );
  const hasRealSocialContent = Boolean(
    identity.social_hook?.trim() ||
      identity.social_caption?.trim() ||
      identity.social_cta?.trim()
  );
  if (!hasRealStoryContent) contentMissing.push("story_content");
  if (!hasRealContentPack) contentMissing.push("content_pack");
  if (!hasRealSocialContent) contentMissing.push("social_content");

  const digitalMissing = [];
  if (!selectedSlug) digitalMissing.push("slug");
  if (!(publicUrl || publicPath)) digitalMissing.push("public_link");
  if (!selected?.qr_code_url?.trim()) digitalMissing.push("qr_code_url");

  const commercialMissing = [];
  if (effectiveCommerceStatus !== "ready_for_sale") {
    commercialMissing.push("commerce_status");
  }

  const readiness = {
    production: {
      complete: productionMissing.length === 0,
      missing: productionMissing,
    },
    character: {
      complete: characterMissing.length === 0,
      missing: characterMissing,
    },
    content: {
      complete: contentMissing.length === 0,
      missing: contentMissing,
    },
    digital: {
      complete: digitalMissing.length === 0,
      missing: digitalMissing,
    },
    commercial: {
      complete: commercialMissing.length === 0,
      missing: commercialMissing,
    },
  };

  return {
    ...readiness,
    overall: Object.values(readiness).every((section) => section.complete),
  };
}

export function buildSelectedIdentityViewState({
  selected,
  identity,
  currentWorkflowStageStatus,
}) {
  const dollIdentityThemeRaw =
    identity.theme_name?.trim() || selected?.theme_name?.trim() || "";
  const dollIdentityTheme =
    dollIdentityThemeRaw && dollIdentityThemeRaw.toLowerCase() !== "unassigned"
      ? dollIdentityThemeRaw
      : "";
  const dollIdentityWorld =
    identity.character_world?.trim() || selected?.character_world?.trim() || "";
  const dollIdentityCollection = dollIdentityTheme || dollIdentityWorld || "Unassigned";
  const dollIdentityArtist = selected?.artist_name?.trim() || "";

  return {
    dollIdentityCollection,
    dollIdentityArtistDisplay: dollIdentityArtist || "Unassigned",
    dollIdentityArtistIsEmpty: !dollIdentityArtist,
    dollIdentityWorkflowState: pipelineStageStateLabel(currentWorkflowStageStatus),
  };
}

export function buildDigitalWorkspaceState({
  selected,
  identity,
  story,
  contentPack,
  qrDataUrl,
  effectiveAccessStatus,
  effectiveSalesStatus,
  legacyAvailabilityStatus,
  selectedSlug,
}) {
  const qrSalesStatus = effectiveSalesStatus;
  const qrAvailabilityStatus = legacyAvailabilityStatus;
  const qrIsSensitive =
    qrSalesStatus === "reserved" ||
    qrSalesStatus === "sold" ||
    qrAvailabilityStatus === "assigned";
  const selectedIsArchived = selected?.status === "archived";
  const hasQrIdentity = Boolean(
    qrDataUrl || selected?.qr_code_url || effectiveAccessStatus === "generated"
  );
  const hasImage = Boolean(identity.image_url?.trim());
  const hasStoryContent = Boolean(
    story.teaser?.trim() || story.mainStory?.trim() || story.mini1?.trim() || story.mini2?.trim()
  );
  const hasContentAssets = Boolean(
    contentPack.caption?.trim() ||
      contentPack.hook?.trim() ||
      contentPack.blurb?.trim() ||
      contentPack.cta?.trim()
  );

  return {
    qrIsSensitive,
    dangerNeedsArchiveWarning: qrIsSensitive,
    dangerNeedsTypedDelete:
      qrSalesStatus === "sold" || qrAvailabilityStatus === "assigned",
    qrSensitivityLabel: qrIsSensitive ? "Sensitive" : "Editable",
    qrSensitivityText: qrIsSensitive
      ? "Reserved, sold, or assigned dolls should only get a new QR when you are sure the owner can safely receive the updated link."
      : "This doll is still editable, so generating or regenerating the QR is safe.",
    qrWarningMessage:
      qrSalesStatus === "sold"
        ? "This doll has already been sold. Regenerating the QR may break access for the owner."
        : qrSalesStatus === "reserved"
          ? "This doll has already been reserved. Regenerating the QR may break access for the customer."
          : "This doll has already been assigned. Regenerating the QR may break access for the owner.",
    archiveWarningMessage:
      qrSalesStatus === "sold"
        ? "This doll has already been sold. Archiving it will keep the digital identity intact, but you should only do this if the owner can still reach the right page and QR."
        : qrSalesStatus === "reserved"
          ? "This doll has already been reserved. Archiving it will keep the digital identity intact, but you should confirm the customer will not lose access."
          : "This doll has already been assigned. Archiving it will keep the digital identity intact, but you should confirm the recipient will not lose access.",
    deleteWarningMessage:
      qrSalesStatus === "sold"
        ? "This doll has already been sold. Deleting it will remove its digital identity, public page content, QR link, and order history."
        : qrSalesStatus === "reserved"
          ? "This doll has already been reserved. Deleting it will remove its digital identity, public page content, QR link, and order history."
          : qrAvailabilityStatus === "assigned"
            ? "This doll has already been assigned. Deleting it will remove its digital identity, public page content, QR link, and order history."
            : "This will permanently remove the doll, its digital identity, public page content, QR link, stories, content assets, and orders.",
    selectedIsArchived,
    hasQrIdentity,
    hasImage,
    hasStoryContent,
    hasContentAssets,
    digitalHints: [
      !hasQrIdentity ? "Generate a QR code to activate this doll." : "",
      hasQrIdentity ? "This QR links the physical doll to its digital story page." : "",
      hasQrIdentity && qrIsSensitive ? "This QR may already be in use by the owner." : "",
    ].filter(Boolean),
    dataQualityHints: [
      !selectedSlug ? "Add a public slug to enable the doll page and QR experience." : "",
    ].filter(Boolean),
  };
}

export function buildWorkflowFeedbackState({ error, notice, selectedIsArchived }) {
  if (error) {
    return {
      tone: "error",
      message: error,
    };
  }

  if (notice) {
    return {
      tone: "success",
      message: notice,
    };
  }

  if (selectedIsArchived) {
    return {
      tone: "muted",
      message:
        "This doll is archived. Its digital identity and related records are preserved, but it is no longer part of the active lifecycle.",
    };
  }

  return null;
}

export function buildSelectedWorkspaceViewState({
  selected,
  identity,
  story,
  contentPack,
  order,
  qrDataUrl,
  dolls,
  contentManagementByDoll,
  selectedContentManagement,
  selectedGeneratedV1Content,
  activeDepartment,
  activeStageView,
  selectedWorkspaceMode,
  operationsFilter,
  operationsSort,
  selectedSlug,
  publicPath,
  publicUrl,
  savedSlug,
  legacyLockedSlug,
  error,
  notice,
}) {
  const legacySalesStatus = (selected?.sales_status || "").toLowerCase();
  const effectiveSalesStatus = legacySalesStatus || "not_sold";
  const legacyAvailabilityStatus = (selected?.availability_status || "").toLowerCase();
  const effectiveCommerceStatus = normalizeCommerceStatus(selected?.commerce_status);
  const effectiveAccessStatus =
    typeof selected?.access_status === "string" && selected.access_status.trim()
      ? selected.access_status.trim().toLowerCase()
      : selected?.qr_code_url
        ? "generated"
        : "not_generated";
  const selectedPipelineState = selected
    ? withNormalizedPipelineState(selected, {
        timestamp: getPipelineNormalizationTimestamp(selected),
      }).pipelineState
    : null;
  const currentOpenPipelineStage = selectedPipelineState
    ? getCurrentOpenPipelineStage(selectedPipelineState)
    : null;
  const currentWorkflowStageKey =
    currentOpenPipelineStage ||
    [...PIPELINE_STAGE_ORDER]
      .reverse()
      .find((stage) => selectedPipelineState?.[stage]?.status === "completed") ||
    "registered";
  const currentWorkflowStageLabel = PIPELINE_STAGE_LABELS[currentWorkflowStageKey] || "Registered";
  const currentWorkflowStageStatus =
    selectedPipelineState?.[currentWorkflowStageKey]?.status || "locked";
  const identityViewState = buildSelectedIdentityViewState({
    selected,
    identity,
    currentWorkflowStageStatus,
  });
  const digitalWorkspaceState = buildDigitalWorkspaceState({
    selected,
    identity,
    story,
    contentPack,
    qrDataUrl,
    effectiveAccessStatus,
    effectiveSalesStatus,
    legacyAvailabilityStatus,
    selectedSlug,
  });
  const selectedReadiness = buildSelectedReadinessState({
    selected,
    identity,
    story,
    contentPack,
    selectedSlug,
    publicPath,
    publicUrl,
    effectiveCommerceStatus,
  });
  const gatewayReady =
    Boolean(selectedReadiness?.digital?.complete) &&
    Boolean(selectedReadiness?.commercial?.complete);
  const gatewayReadinessState = {
    complete: gatewayReady,
    missing: selectedReadiness?.digital?.complete
      ? selectedReadiness?.commercial?.missing || []
      : selectedReadiness?.digital?.missing || [],
  };
  const productionWorkflowComplete =
    selectedReadiness.production.complete &&
    selectedReadiness.character.complete &&
    selectedReadiness.content.complete &&
    selectedReadiness.digital.complete;
  const qrReady =
    selectedReadiness.production.complete &&
    selectedReadiness.character.complete &&
    selectedReadiness.content.complete;
  const qrReadinessMessage =
    "Complete Production, Character, and Content before generating a QR code.";
  const saleTransitionReadinessMessage =
    "Complete all readiness sections before confirming or progressing this order.";
  const currentDepartment = selected ? activeDepartment || "Overview" : "";
  const currentStageView = selected ? activeStageView || "overview" : "";
  const currentSelectedWorkspaceMode = selected ? selectedWorkspaceMode || "dashboard" : "";
  const isContentStudioWorkspace = currentSelectedWorkspaceMode === "content_studio";
  const currentStageViewStatus =
    currentStageView && PIPELINE_STAGE_ORDER.includes(currentStageView)
      ? selectedPipelineState?.[currentStageView]?.status || "locked"
      : null;
  const workflowViewState = buildWorkflowViewState({
    selectedReadiness,
    qrReady,
    currentStageView,
    currentStageViewStatus,
  });
  const showWorkflowGuidance =
    currentStageView !== "overview" && currentStageView !== "ready";
  const workflowFeedback = buildWorkflowFeedbackState({
    error,
    notice,
    selectedIsArchived: digitalWorkspaceState.selectedIsArchived,
  });
  const hasContentPreview = Boolean(savedSlug || legacyLockedSlug);
  const contentPreviewHref = hasContentPreview ? publicUrl || publicPath : "";
  const contentAssetCompleteness = buildContentAssetCompleteness({
    identityImageUrl: identity.image_url,
    selectedImageUrl: selected?.image_url,
    qrDataUrl,
    selectedQrCodeUrl: selected?.qr_code_url,
    story,
    selectedStoryMain: selected?.story_main,
    selectedStory: selected?.story,
  });
  const contentManagementViewState = buildContentManagementViewState({
    selectedContentManagement,
    contentAssetCompleteness,
  });
  const selectedEditablePlayActivity = buildEditablePlayActivityState(
    selectedGeneratedV1Content?.play_activity
  );
  const selectedHasPlayActivityChoices = hasPlayActivityChoiceContent(
    selectedGeneratedV1Content?.play_activity?.choices
  );
  const operationsBoardState = buildOperationsBoardState({
    dolls,
    contentManagementByDoll,
    operationsFilter,
    operationsSort,
  });
  const dashboardWorkspaceState = buildDashboardWorkspaceState({
    selectedReadiness,
    contentManagementNextStepGuidance:
      contentManagementViewState.contentManagementNextStepGuidance,
    globalWorkspaceNextStepMessage: workflowViewState.globalWorkspaceNextStepMessage,
    currentSelectedWorkspaceMode,
    currentWorkflowStageLabel,
    dollIdentityWorkflowState: identityViewState.dollIdentityWorkflowState,
    selectedContentManagement,
    contentManagementStateSummary: contentManagementViewState.contentManagementStateSummary,
    contentAssetCompleteness,
  });
  const savedQrUrl = selected?.qr_code_url || "";
  const qrStatus = !qrDataUrl
    ? "empty"
    : savedQrUrl && qrDataUrl === savedQrUrl
      ? "saved"
      : "generated";
  const productionStageStatus = selectedPipelineState?.registered?.status || "locked";
  const characterStageStatus = selectedPipelineState?.character?.status || "locked";
  const contentStageStatus = selectedPipelineState?.content?.status || "locked";
  const gatewayStageStatus = selectedPipelineState?.gateway?.status || "locked";

  return {
    effectiveSalesStatus,
    effectiveCommerceStatus,
    effectiveAccessStatus,
    selectedPipelineState,
    currentOpenPipelineStage,
    currentWorkflowStageLabel,
    currentWorkflowStageStatus,
    ...identityViewState,
    ...digitalWorkspaceState,
    selectedReadiness,
    gatewayReadinessState,
    productionWorkflowComplete,
    qrReady,
    qrReadinessMessage,
    saleTransitionReadinessMessage,
    currentDepartment,
    currentStageView,
    currentSelectedWorkspaceMode,
    currentStageViewStatus,
    ...workflowViewState,
    showWorkflowGuidance,
    workflowFeedback,
    contentPreviewHref,
    contentAssetCompleteness,
    ...contentManagementViewState,
    selectedEditablePlayActivity,
    selectedHasPlayActivityChoices,
    ...operationsBoardState,
    ...dashboardWorkspaceState,
    savedQrUrl,
    qrStatus,
    isProductionEditable: isStageEditable(productionStageStatus),
    isCharacterEditable: isStageEditable(characterStageStatus),
    // Content Studio remains the content-operations workspace even after the
    // pipeline has moved past the content stage.
    isContentEditable: Boolean(selected) && (
      isContentStudioWorkspace || isStageEditable(contentStageStatus)
    ),
    isGatewayEditable: isStageEditable(gatewayStageStatus),
  };
}
