import {
  PIPELINE_STAGE_ORDER,
  getCurrentOpenPipelineStage,
  withNormalizedPipelineState,
} from "../../../lib/pipelineState";
import {
  buildLocalContentManagementState,
  hasV1GeneratedContent,
  normalizeCommerceStatus,
} from "./content";
import { getPipelineNormalizationTimestamp } from "./workflow";

export function deriveDollOperationsModel(doll = {}, contentManagementState) {
  const normalizedContentManagementState =
    contentManagementState || buildLocalContentManagementState(doll);
  const normalizedPipelineRecord = withNormalizedPipelineState(doll, {
    timestamp: getPipelineNormalizationTimestamp(doll),
  });
  const normalizedPipelineState = normalizedPipelineRecord?.pipelineState;
  const currentOpenStage = normalizedPipelineState
    ? getCurrentOpenPipelineStage(normalizedPipelineState)
    : "registered";
  const allPipelineStagesCompleted = PIPELINE_STAGE_ORDER.every(
    (stage) => normalizedPipelineState?.[stage]?.status === "completed"
  );
  const hasGeneratedContent =
    normalizedContentManagementState.generation_status === "generated" ||
    hasV1GeneratedContent(doll);
  const hasSlug = Boolean(typeof doll?.slug === "string" && doll.slug.trim());
  const hasQrCode = Boolean(
    typeof doll?.qr_code_url === "string" && doll.qr_code_url.trim()
  );
  const normalizedCommerceStatus = normalizeCommerceStatus(doll?.commerce_status);

  let production_bucket = "needs_production_setup";

  if (doll?.status === "archived") {
    production_bucket = "archived";
  } else if (currentOpenStage === "character") {
    production_bucket = "needs_character_work";
  } else if (currentOpenStage === "content") {
    production_bucket = "ready_for_content_handoff";
  } else if (currentOpenStage === "gateway") {
    production_bucket = "blocked_in_gateway";
  } else if (currentOpenStage === "ready" || allPipelineStagesCompleted) {
    production_bucket = "production_complete";
  } else {
    production_bucket = "needs_production_setup";
  }

  let content_bucket = "waiting_for_content_stage";

  if (doll?.status === "archived") {
    content_bucket = "archived";
  } else if (normalizedContentManagementState.publish_status === "live") {
    content_bucket = "live";
  } else if (
    normalizedContentManagementState.review_status === "approved" &&
    normalizedContentManagementState.publish_status !== "live"
  ) {
    content_bucket = "ready_to_publish";
  } else if (hasGeneratedContent) {
    content_bucket = "needs_review";
  } else if (
    [
      "ready_for_content_handoff",
      "blocked_in_gateway",
      "production_complete",
    ].includes(production_bucket)
  ) {
    content_bucket = "needs_generation";
  } else {
    content_bucket = "waiting_for_content_stage";
  }

  let attention_type = "none";

  if (doll?.status === "archived") {
    attention_type = "none";
  } else if (
    [
      "needs_production_setup",
      "needs_character_work",
      "blocked_in_gateway",
    ].includes(production_bucket)
  ) {
    attention_type = "production";
  } else if (
    ["needs_generation", "needs_review", "ready_to_publish"].includes(content_bucket)
  ) {
    attention_type = "content";
  }

  const recommended_workspace =
    attention_type === "production"
      ? "pipeline"
      : attention_type === "content"
        ? "content_studio"
        : "dashboard";
  const needs_attention = attention_type !== "none";

  let next_action = "No action";
  let recommended_workspace_reason =
    "This doll has no active production or content work in V1.";

  if (doll?.status === "archived") {
    next_action = "Archived";
    recommended_workspace_reason =
      "Archived dolls stay outside the active triage queues.";
  } else if (production_bucket === "needs_production_setup") {
    next_action =
      typeof doll?.image_url === "string" && doll.image_url.trim()
        ? "Complete Production stage"
        : "Add image in Production";
    recommended_workspace_reason =
      "Production prerequisites are not complete yet.";
  } else if (production_bucket === "needs_character_work") {
    next_action = "Complete Character stage";
    recommended_workspace_reason =
      "Character inputs are the current pipeline bottleneck.";
  } else if (production_bucket === "blocked_in_gateway") {
    if (!hasSlug) {
      next_action = "Add public slug";
    } else if (!hasQrCode) {
      next_action = "Generate QR";
    } else if (normalizedCommerceStatus !== "ready_for_sale") {
      next_action = "Set commerce to Ready for Sale";
    } else {
      next_action = "Complete Gateway stage";
    }
    recommended_workspace_reason =
      "The doll is waiting on digital activation or commerce readiness.";
  } else if (content_bucket === "needs_generation") {
    next_action = "Generate content";
    recommended_workspace_reason =
      "The pipeline is ready for content work, but no V1 generated content exists yet.";
  } else if (content_bucket === "needs_review") {
    next_action = "Review and approve content";
    recommended_workspace_reason =
      "Generated content exists but is still in draft review state.";
  } else if (content_bucket === "ready_to_publish") {
    next_action = "Publish content";
    recommended_workspace_reason =
      "Content has been approved and is waiting to go live.";
  } else if (content_bucket === "live") {
    next_action = "No action";
    recommended_workspace_reason = "Content is already live.";
  }

  let urgency = "none";

  if (
    doll?.status === "archived" ||
    attention_type === "none" ||
    content_bucket === "live"
  ) {
    urgency = "none";
  } else if (
    production_bucket === "blocked_in_gateway" ||
    content_bucket === "ready_to_publish"
  ) {
    urgency = "high";
  } else if (
    production_bucket === "needs_character_work" ||
    content_bucket === "needs_review" ||
    content_bucket === "needs_generation"
  ) {
    urgency = "medium";
  } else if (
    production_bucket === "needs_production_setup" ||
    production_bucket === "ready_for_content_handoff"
  ) {
    urgency = "low";
  }

  return {
    id: doll?.id || null,
    internal_id: doll?.internal_id || "",
    name: doll?.name || "Untitled doll",
    theme_name: doll?.theme_name || "Unassigned",
    attention_type,
    production_bucket,
    content_bucket,
    next_action,
    recommended_workspace,
    recommended_workspace_reason,
    needs_attention,
    urgency,
    updated_at:
      (typeof doll?.updated_at === "string" && doll.updated_at.trim()) ||
      (typeof doll?.created_at === "string" && doll.created_at.trim()) ||
      "",
  };
}

export function compareOperationsCards(left, right) {
  const urgencyWeights = {
    high: 0,
    medium: 1,
    low: 2,
    none: 3,
  };
  const leftUrgencyWeight = urgencyWeights[left?.urgency] ?? urgencyWeights.none;
  const rightUrgencyWeight = urgencyWeights[right?.urgency] ?? urgencyWeights.none;
  const urgencyDelta = leftUrgencyWeight - rightUrgencyWeight;

  if (urgencyDelta !== 0) {
    return urgencyDelta;
  }

  const leftTimestamp = Date.parse(left?.updated_at || "");
  const rightTimestamp = Date.parse(right?.updated_at || "");
  const leftHasTimestamp = Number.isFinite(leftTimestamp);
  const rightHasTimestamp = Number.isFinite(rightTimestamp);

  if (leftHasTimestamp && rightHasTimestamp && leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  if (leftHasTimestamp !== rightHasTimestamp) {
    return leftHasTimestamp ? -1 : 1;
  }

  const nameDelta = (left?.name || "").localeCompare(right?.name || "");
  if (nameDelta !== 0) {
    return nameDelta;
  }

  return (left?.internal_id || "").localeCompare(right?.internal_id || "");
}

export function operationsWorkspaceButtonLabel(workspace = "dashboard") {
  if (workspace === "pipeline") return "Open Pipeline";
  if (workspace === "content_studio") return "Open Content Studio";
  return "Open Dashboard";
}

export function matchesOperationsFilter(operation, filter = "all") {
  if (!operation || typeof operation !== "object") {
    return false;
  }

  if (filter === "needs_attention") {
    return Boolean(operation.needs_attention);
  }

  if (filter === "production") {
    return operation.attention_type === "production";
  }

  if (filter === "content") {
    return operation.attention_type === "content";
  }

  if (filter === "live") {
    return operation.content_bucket === "live";
  }

  if (filter === "archived") {
    return (
      operation.production_bucket === "archived" ||
      operation.content_bucket === "archived"
    );
  }

  return true;
}

export function compareOperationsByLastUpdated(left, right) {
  const leftTimestamp = Date.parse(left?.updated_at || "");
  const rightTimestamp = Date.parse(right?.updated_at || "");
  const leftHasTimestamp = Number.isFinite(leftTimestamp);
  const rightHasTimestamp = Number.isFinite(rightTimestamp);

  if (leftHasTimestamp && rightHasTimestamp && leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  if (leftHasTimestamp !== rightHasTimestamp) {
    return leftHasTimestamp ? -1 : 1;
  }

  return compareOperationsByName(left, right);
}

export function compareOperationsByName(left, right) {
  const nameDelta = (left?.name || "").localeCompare(right?.name || "");
  if (nameDelta !== 0) {
    return nameDelta;
  }

  return (left?.internal_id || "").localeCompare(right?.internal_id || "");
}

export function sortOperationsList(items, sortMode = "urgency") {
  const nextItems = Array.isArray(items) ? [...items] : [];

  if (sortMode === "last_updated") {
    return nextItems.sort(compareOperationsByLastUpdated);
  }

  if (sortMode === "name") {
    return nextItems.sort(compareOperationsByName);
  }

  return nextItems.sort(compareOperationsCards);
}

export function buildOperationsBoardViewState(filter = "all") {
  const showPassiveOperationsResults = filter === "live" || filter === "archived";
  const showProductionQueue =
    !showPassiveOperationsResults &&
    ["all", "needs_attention", "production"].includes(filter);
  const showContentQueue =
    !showPassiveOperationsResults &&
    ["all", "needs_attention", "content"].includes(filter);
  const passiveOperationsTitle =
    filter === "archived" ? "Archived Dolls" : "Live Dolls";
  const passiveOperationsMeta =
    filter === "archived"
      ? "A read-only reference list for dolls that have been archived out of active operations."
      : "A read-only reference list for dolls whose content is already live.";

  return {
    showPassiveOperationsResults,
    showProductionQueue,
    showContentQueue,
    passiveOperationsTitle,
    passiveOperationsMeta,
  };
}

export function operationsQueueEmptyStateText(queueType = "production", filter = "all") {
  if (queueType === "production") {
    return filter === "production"
      ? "No dolls are waiting in Production right now. The production queue is clear."
      : "No dolls currently need production attention. Operators can focus elsewhere for now.";
  }

  return filter === "content"
    ? "No dolls are waiting in Content right now. The content queue is clear."
    : "No dolls currently need content attention. Operators can focus elsewhere for now.";
}

export function operationsPassiveEmptyStateText(filter = "live") {
  return filter === "archived"
    ? "No archived dolls are on record yet. Archived dolls will appear here as a read-only reference list."
    : "No dolls are live yet. When content is marked live, those dolls will appear here for quick reference.";
}
