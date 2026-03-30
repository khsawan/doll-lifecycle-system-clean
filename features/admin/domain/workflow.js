import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  getCurrentOpenPipelineStage,
  withNormalizedPipelineState,
} from "../../../lib/pipelineState";
import { PIPELINE_STAGE_READINESS_KEYS } from "../constants/workflow";

function normalizeLifecycleStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "live" ? "sales" : normalized;
}

export function statusLabel(status) {
  const normalized = normalizeLifecycleStatus(status);
  if (!normalized) return "New";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatStatusToken(value) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isMissingPipelineStateColumnError(error) {
  const errorText = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    errorText.includes("pipeline_state") &&
    (errorText.includes("column") ||
      errorText.includes("schema cache") ||
      errorText.includes("could not find"))
  );
}

export function pipelineStageStateLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "open") return "In Progress";
  return "Locked";
}

export function getPipelineStageReadinessKey(stage) {
  return PIPELINE_STAGE_READINESS_KEYS[stage] || null;
}

export function getPipelineStageReadinessState(stage, readinessState, derivedReadiness = {}) {
  const readinessKey = getPipelineStageReadinessKey(stage);
  if (!readinessKey || !readinessState) return null;
  if (derivedReadiness[readinessKey]) {
    return derivedReadiness[readinessKey];
  }
  if (readinessKey === "overall") {
    return {
      complete: Boolean(readinessState.overall),
      missing: [],
    };
  }
  return readinessState[readinessKey] || null;
}

export function readinessMissingLabel(key) {
  const labels = {
    internal_id: "Missing record ID",
    image_url: "Missing image",
    color_palette: "Missing color palette",
    notable_features: "Missing notable features",
    name: "Missing name",
    theme_name: "Missing theme",
    universe_or_theme: "Missing assignment",
    personality_traits: "Missing personality traits",
    emotional_hook: "Missing emotional hook",
    expression_feel: "Missing expression/face feel",
    character_world: "Missing character world",
    story_content: "Missing story",
    content_pack: "Missing content pack",
    social_content: "Missing social content",
    slug: "Missing slug",
    public_link: "Missing public link",
    qr_code_url: "QR not generated",
    commercial_status: "Product commerce status is not ready for sale",
    commerce_status: "Product commerce status is not ready for sale",
  };

  return labels[key] || `Missing ${formatStatusToken(key)}`;
}

export function buildPipelineStageBlockedMessage(stage, readinessState) {
  const stageLabel = PIPELINE_STAGE_LABELS[stage] || formatStatusToken(stage);
  const readinessKey = getPipelineStageReadinessKey(stage);
  const firstMissing = readinessState?.missing?.[0];

  if (readinessKey === "gateway") {
    const gatewayBlockingLabel =
      firstMissing === "commerce_status" || firstMissing === "commercial_status"
        ? "Product Commerce"
        : "Digital";

    return firstMissing
      ? `Complete ${gatewayBlockingLabel} readiness before completing ${stageLabel}. ${readinessMissingLabel(firstMissing)}.`
      : `Complete ${gatewayBlockingLabel} readiness before completing ${stageLabel}.`;
  }

  if (readinessKey === "overall") {
    return `Complete all readiness sections before completing ${stageLabel}.`;
  }
  const readinessLabel = readinessKey ? formatStatusToken(readinessKey) : "Required";

  return firstMissing
    ? `Complete ${readinessLabel} readiness before completing ${stageLabel}. ${readinessMissingLabel(firstMissing)}.`
    : `Complete ${readinessLabel} readiness before completing ${stageLabel}.`;
}

export function getPipelineNormalizationTimestamp(record) {
  if (!record || typeof record !== "object") {
    return undefined;
  }

  if (typeof record.created_at === "string" && record.created_at.trim()) {
    return record.created_at;
  }

  if (typeof record.updated_at === "string" && record.updated_at.trim()) {
    return record.updated_at;
  }

  return undefined;
}

export function syncDollRecordPipelineState(record, pipelineState, options = {}) {
  if (!record || typeof record !== "object") {
    return record;
  }

  const timestamp = getPipelineNormalizationTimestamp(record);
  const normalizedPipelineState = withNormalizedPipelineState(
    { pipelineState },
    { timestamp }
  ).pipelineState;
  const nextRecord = {
    ...record,
    pipelineState: normalizedPipelineState,
  };

  if (options.persisted || Object.prototype.hasOwnProperty.call(record, "pipeline_state")) {
    nextRecord.pipeline_state = normalizedPipelineState;
  }

  return withNormalizedPipelineState(nextRecord, { timestamp });
}

export function isStageEditable(stageStatus) {
  return stageStatus === "open";
}

export function getPipelineProgressPercent(record) {
  if (!record || typeof record !== "object") {
    return 0;
  }

  const normalizedRecord = withNormalizedPipelineState(record, {
    timestamp: getPipelineNormalizationTimestamp(record),
  });
  const normalizedPipelineState = normalizedRecord?.pipelineState;

  if (!normalizedPipelineState) {
    return 0;
  }

  const completedStages = PIPELINE_STAGE_ORDER.filter(
    (stage) => normalizedPipelineState[stage]?.status === "completed"
  ).length;
  const hasOpenStage = PIPELINE_STAGE_ORDER.some(
    (stage) => normalizedPipelineState[stage]?.status === "open"
  );
  const progressUnits = Math.min(
    PIPELINE_STAGE_ORDER.length,
    completedStages + (hasOpenStage ? 0.5 : 0)
  );

  return Math.round((progressUnits / PIPELINE_STAGE_ORDER.length) * 100);
}

export function buildReadiness(identity, story, contentPack, order, publicUrl) {
  const checks = {
    identity:
      Boolean(identity.name?.trim()) &&
      Boolean(identity.theme_name?.trim()) &&
      Boolean(identity.personality_traits?.trim()) &&
      Boolean(identity.emotional_hook?.trim()) &&
      Boolean(identity.short_intro?.trim()),
    story:
      Boolean(story.teaser?.trim()) &&
      Boolean(story.mainStory?.trim()) &&
      Boolean(story.mini1?.trim()) &&
      Boolean(story.mini2?.trim()),
    digital: Boolean(publicUrl?.trim()),
    content:
      Boolean(contentPack.caption?.trim()) &&
      Boolean(contentPack.hook?.trim()) &&
      Boolean(contentPack.blurb?.trim()) &&
      Boolean(contentPack.cta?.trim()),
    sales:
      Boolean(order.customer_name?.trim()) &&
      Boolean(order.contact_info?.trim()) &&
      Boolean(order.order_status?.trim()),
  };

  const entries = Object.entries(checks);
  const completed = entries.filter(([, value]) => value).length;
  const score = Math.round((completed / entries.length) * 100);

  return {
    checks,
    score,
    missing: entries.filter(([, value]) => !value).map(([key]) => key),
  };
}
