"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  completePipelineStageTransition,
  createDefaultPipelineState,
  createPipelineTimestamp,
  getDownstreamPipelineStages,
  getCurrentOpenPipelineStage,
  getNextPipelineStage,
  isSamePipelineState,
  reopenPipelineStageTransition,
  withNormalizedPipelineState,
} from "../lib/pipelineState";

const DEFAULT_THEMES = [
  "Unassigned",
  "Nature Friends",
  "Little Dreamers",
  "Cozy World",
];
const STORY_TONES = ["Gentle", "Playful", "Magical"];
const COMMERCE_STATUSES = Object.freeze(["draft", "ready_for_sale", "unavailable"]);
const CONTENT_GENERATION_STATUSES = Object.freeze(["not_started", "generated"]);
const CONTENT_REVIEW_STATUSES = Object.freeze(["draft", "approved"]);
const CONTENT_PUBLISH_STATUSES = Object.freeze(["hidden", "live"]);
const DEFAULT_CONTENT_MANAGEMENT_STATE = Object.freeze({
  generation_status: "not_started",
  review_status: "draft",
  publish_status: "hidden",
});
const V1_PLAY_ACTIVITY_CHOICE_IDS = Object.freeze([
  "comforting_object",
  "playful_action",
  "friendly_interaction",
]);
const OPERATIONS_PRODUCTION_QUEUE_BUCKET_ORDER = Object.freeze([
  "needs_production_setup",
  "needs_character_work",
  "blocked_in_gateway",
]);
const OPERATIONS_CONTENT_QUEUE_BUCKET_ORDER = Object.freeze([
  "needs_generation",
  "needs_review",
  "ready_to_publish",
]);
const OPERATIONS_BOARD_FILTERS = Object.freeze([
  { value: "all", label: "All" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "production", label: "Production" },
  { value: "content", label: "Content" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
]);
const OPERATIONS_BOARD_SORT_OPTIONS = Object.freeze([
  { value: "urgency", label: "Urgency" },
  { value: "last_updated", label: "Last Updated" },
  { value: "name", label: "Name" },
]);
const PRODUCTION_STAGES = PIPELINE_STAGE_ORDER.map((stage, index) => ({
  key: stage,
  value: index + 1,
  label: PIPELINE_STAGE_LABELS[stage],
}));
const PIPELINE_STAGE_READINESS_KEYS = Object.freeze({
  registered: "production",
  character: "character",
  content: "content",
  gateway: "gateway",
  ready: "overall",
});
const DEPARTMENTS = [
  "Overview",
  "Production",
  "Character",
  "Content",
  "Digital",
  "Commerce",
  "Danger Zone",
];
const showLegacyDepartmentsNavigation = false;
const ADMIN_AUTH_STORAGE_KEY = "doll_admin_authenticated";
const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() ||
  process.env.ADMIN_PASSWORD?.trim() ||
  "";

function normalizeLifecycleStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "live" ? "sales" : normalized;
}

function normalizeCommerceStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return COMMERCE_STATUSES.includes(normalized) ? normalized : "draft";
}

function normalizeContentGenerationStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return CONTENT_GENERATION_STATUSES.includes(normalized)
    ? normalized
    : DEFAULT_CONTENT_MANAGEMENT_STATE.generation_status;
}

function normalizeContentReviewStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return CONTENT_REVIEW_STATUSES.includes(normalized)
    ? normalized
    : DEFAULT_CONTENT_MANAGEMENT_STATE.review_status;
}

function normalizeContentPublishStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return CONTENT_PUBLISH_STATUSES.includes(normalized)
    ? normalized
    : DEFAULT_CONTENT_MANAGEMENT_STATE.publish_status;
}

function buildLocalContentManagementState(record = {}) {
  const hasPersistedGeneratedContent = hasV1GeneratedContent({
    intro_script: record?.intro_script,
    story_pages: record?.story_pages,
    play_activity: record?.play_activity,
  });

  return {
    generation_status:
      normalizeContentGenerationStatus(record?.generation_status) === "generated" ||
      hasPersistedGeneratedContent
        ? "generated"
        : "not_started",
    review_status: normalizeContentReviewStatus(record?.review_status),
    publish_status: normalizeContentPublishStatus(record?.publish_status),
  };
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function statusLabel(status) {
  const normalized = normalizeLifecycleStatus(status);
  if (!normalized) return "New";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatStatusToken(value) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMissingPipelineStateColumnError(error) {
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

function pipelineStageStateLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "open") return "In Progress";
  return "Locked";
}

function getPipelineStageReadinessKey(stage) {
  return PIPELINE_STAGE_READINESS_KEYS[stage] || null;
}

function getPipelineStageReadinessState(stage, readinessState, derivedReadiness = {}) {
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

function buildPipelineStageBlockedMessage(stage, readinessState) {
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

function getPipelineNormalizationTimestamp(record) {
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

function syncDollRecordPipelineState(record, pipelineState, options = {}) {
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

function isStageEditable(stageStatus) {
  return stageStatus === "open";
}

function disabledFormControlStyle(baseStyle) {
  return {
    ...baseStyle,
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  };
}

function disabledActionStyle(baseStyle) {
  return {
    ...baseStyle,
    opacity: 0.6,
    cursor: "not-allowed",
  };
}

function readinessMissingLabel(key) {
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

function getPipelineProgressPercent(record) {
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

function cleanList(value) {
  return (value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function getPublicBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function buildAdminVersionInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "unknown";
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE?.trim() || "unknown";
  const env = process.env.VERCEL_ENV?.trim() || "unknown";
  const shortSha = sha === "unknown" ? "unknown" : sha.slice(0, 7);
  const envLabel = env.charAt(0).toUpperCase() + env.slice(1);

  return {
    sha: shortSha,
    message,
    env: envLabel,
    label: `v${shortSha} • ${envLabel} • ${message}`,
  };
}

function emptyStoryState() {
  return {
    teaser: "",
    mainStory: "",
    mini1: "",
    mini2: "",
  };
}

function normalizeStoryVariationCandidate(value, index) {
  const storyMain = typeof value?.story_main === "string" ? value.story_main.trim() : "";

  if (!storyMain) {
    return null;
  }

  const rawId = typeof value?.id === "string" ? value.id.trim() : "";
  const rawLabel = typeof value?.label === "string" ? value.label.trim() : "";

  return {
    id: /^[a-z0-9_-]+$/i.test(rawId) ? rawId : `v${index + 1}`,
    label: rawLabel || `Version ${index + 1}`,
    story_main: storyMain,
  };
}

function readStoryVariationCandidates(result) {
  if (!Array.isArray(result?.variations)) {
    return [];
  }

  return result.variations
    .slice(0, 3)
    .map((variation, index) => normalizeStoryVariationCandidate(variation, index))
    .filter(Boolean);
}

function normalizeContentPackVariationCandidate(value, index) {
  const shortIntro =
    typeof value?.short_intro === "string"
      ? value.short_intro.trim()
      : typeof value?.task?.short_intro === "string"
        ? value.task.short_intro.trim()
        : "";
  const contentBlurb =
    typeof value?.content_blurb === "string"
      ? value.content_blurb.trim()
      : typeof value?.task?.content_blurb === "string"
        ? value.task.content_blurb.trim()
        : "";
  const promoHook =
    typeof value?.promo_hook === "string"
      ? value.promo_hook.trim()
      : typeof value?.task?.promo_hook === "string"
        ? value.task.promo_hook.trim()
        : "";
  const cta =
    typeof value?.cta === "string"
      ? value.cta.trim()
      : typeof value?.task?.cta === "string"
        ? value.task.cta.trim()
        : "";

  if (!shortIntro || !contentBlurb || !promoHook || !cta) {
    return null;
  }

  const rawId = typeof value?.id === "string" ? value.id.trim() : "";
  const rawLabel = typeof value?.label === "string" ? value.label.trim() : "";

  return {
    id: /^[a-z0-9_-]+$/i.test(rawId) ? rawId : `v${index + 1}`,
    label: rawLabel || `Version ${index + 1}`,
    short_intro: shortIntro,
    content_blurb: contentBlurb,
    promo_hook: promoHook,
    cta,
  };
}

function readContentPackVariationCandidates(result) {
  if (!Array.isArray(result?.variations)) {
    return [];
  }

  return result.variations
    .slice(0, 3)
    .map((variation, index) => normalizeContentPackVariationCandidate(variation, index))
    .filter(Boolean);
}

function normalizeSocialVariationCandidate(value, index) {
  const socialHook =
    typeof value?.social_hook === "string"
      ? value.social_hook.trim()
      : typeof value?.task?.social_hook === "string"
        ? value.task.social_hook.trim()
        : "";
  const socialCaption =
    typeof value?.social_caption === "string"
      ? value.social_caption.trim()
      : typeof value?.task?.social_caption === "string"
        ? value.task.social_caption.trim()
        : "";
  const socialCta =
    typeof value?.social_cta === "string"
      ? value.social_cta.trim()
      : typeof value?.task?.social_cta === "string"
        ? value.task.social_cta.trim()
        : "";

  if (!socialHook || !socialCaption || !socialCta) {
    return null;
  }

  const rawId = typeof value?.id === "string" ? value.id.trim() : "";
  const rawLabel = typeof value?.label === "string" ? value.label.trim() : "";

  return {
    id: /^[a-z0-9_-]+$/i.test(rawId) ? rawId : `v${index + 1}`,
    label: rawLabel || `Version ${index + 1}`,
    social_hook: socialHook,
    social_caption: socialCaption,
    social_cta: socialCta,
  };
}

function readSocialVariationCandidates(result) {
  if (!Array.isArray(result?.variations)) {
    return [];
  }

  return result.variations
    .slice(0, 3)
    .map((variation, index) => normalizeSocialVariationCandidate(variation, index))
    .filter(Boolean);
}

function emptyContentPackState() {
  return {
    caption: "",
    hook: "",
    blurb: "",
    cta: "",
  };
}

function emptyOrderState() {
  return {
    customer_name: "",
    contact_info: "",
    notes: "",
    order_status: "new",
  };
}

function emptyPlayActivityState() {
  return {
    prompt: "",
    choices: [],
  };
}

function emptyV1GeneratedContentState() {
  return {
    intro_script: "",
    story_pages: ["", "", "", ""],
    play_activity: emptyPlayActivityState(),
  };
}

function buildEditablePlayActivityState(value = {}) {
  const choices = Array.isArray(value?.choices) ? value.choices.slice(0, 3) : [];

  while (choices.length < 3) {
    choices.push({
      id: V1_PLAY_ACTIVITY_CHOICE_IDS[choices.length] || `choice_${choices.length + 1}`,
      label: "",
      result_text: "",
    });
  }

  return {
    prompt: typeof value?.prompt === "string" ? value.prompt : "",
    choices: choices.map((choice, index) => ({
      id: choice?.id || V1_PLAY_ACTIVITY_CHOICE_IDS[index] || `choice_${index + 1}`,
      label: typeof choice?.label === "string" ? choice.label : "",
      result_text:
        typeof choice?.result_text === "string"
          ? choice.result_text
          : typeof choice?.result === "string"
            ? choice.result
            : "",
    })),
  };
}

function emptyGeneratedContentEditorState() {
  return {
    intro_script: false,
    story_pages: [false, false, false, false],
    play_activity: false,
  };
}

function hasPlayActivityChoiceContent(choices = []) {
  return choices.some((choice) =>
    Boolean(choice?.label?.trim() || choice?.result_text?.trim() || choice?.result?.trim())
  );
}

function selectPrimaryPhrase(value, fallback) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return fallback;
  return normalized.split(",")[0].trim() || fallback;
}

function readTrimmedString(value, fallback = "") {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

function buildLocalV1GeneratedContentState(value = {}) {
  const storyPages = Array.isArray(value.story_pages) ? value.story_pages.slice(0, 4) : [];

  while (storyPages.length < 4) {
    storyPages.push("");
  }

  return {
    intro_script: value.intro_script || "",
    story_pages: storyPages.map((page) => (typeof page === "string" ? page : "")),
    play_activity: {
      prompt: value?.play_activity?.prompt || "",
      choices: Array.isArray(value?.play_activity?.choices)
        ? value.play_activity.choices.slice(0, 3).map((choice, index) => ({
            id:
              choice?.id ||
              V1_PLAY_ACTIVITY_CHOICE_IDS[index] ||
              `choice_${index + 1}`,
            label: choice?.label || "",
            result_text: choice?.result_text || choice?.result || "",
          }))
        : [],
    },
  };
}

function hasV1GeneratedContent(value = {}) {
  const normalized = buildLocalV1GeneratedContentState(value);

  return Boolean(
    normalized.intro_script.trim() ||
      normalized.story_pages.some((page) => page.trim()) ||
      normalized.play_activity.prompt.trim() ||
      hasPlayActivityChoiceContent(normalized.play_activity.choices)
  );
}

function buildStorySectionSnapshot(value = {}) {
  return {
    teaser: value.teaser || "",
    mainStory: value.mainStory || "",
    mini1: value.mini1 || "",
    mini2: value.mini2 || "",
  };
}

function buildContentPackSectionSnapshot(value = {}) {
  return {
    caption: value.caption || "",
    hook: value.hook || "",
    blurb: value.blurb || "",
    cta: value.cta || "",
  };
}

function buildSocialSectionSnapshot(value = {}) {
  return {
    social_hook: value.social_hook || "",
    social_caption: value.social_caption || "",
    social_cta: value.social_cta || "",
    social_status: value.social_status || "draft",
  };
}

function sectionStateSignature(value) {
  return JSON.stringify(value);
}

function extractDollAssetPath(url) {
  if (typeof url !== "string" || !url.trim()) return "";

  const normalizedUrl = url.trim();
  const marker = "/storage/v1/object/public/doll-assets/";

  try {
    const parsed = new URL(normalizedUrl);
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return "";
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    const markerIndex = normalizedUrl.indexOf(marker);
    if (markerIndex < 0) return "";
    return normalizedUrl
      .slice(markerIndex + marker.length)
      .split("?")[0]
      .split("#")[0];
  }
}

function buildStoryPack(doll, tone) {
  const name = doll.name || "This doll";
  const theme = doll.theme_name || "Unassigned";
  const traits = cleanList(doll.personality_traits);
  const traitText = traits.length ? traits.slice(0, 3).join(", ") : "gentle, curious, and kind";
  const hook = doll.emotional_hook || `${name} brings warmth and wonder wherever she goes`;
  const intro = doll.short_intro || `${name} turns ordinary moments into soft little stories.`;

  const openers = {
    Gentle: `${name} loves the quiet beauty of small moments and always notices when someone needs comfort.`,
    Playful: `${name} can turn the simplest day into a happy little adventure full of laughter and surprises.`,
    Magical: `${name} moves through the world as if every breeze, flower, and sunrise is holding a tiny secret.`,
  };

  const bridges = {
    Gentle: `With a ${traitText} heart, ${name} makes every place feel softer and safer.`,
    Playful: `With a ${traitText} spirit, ${name} fills the day with smiles, games, and bright ideas.`,
    Magical: `With a ${traitText} spirit, ${name} finds wonder hidden in the smallest details.`,
  };

  const closers = {
    Gentle: `By the end of each day, ${name} leaves a little more kindness behind.`,
    Playful: `${name} always finds a new reason to smile before the sun goes down.`,
    Magical: `Wherever ${name} goes, a little bit of wonder seems to stay behind.`,
  };

  const teaser =
    tone === "Magical"
      ? `Meet ${name}, a one-of-a-kind friend who turns everyday moments into tiny pieces of magic.`
      : tone === "Playful"
        ? `Meet ${name}, a one-of-a-kind friend who makes every day feel brighter, happier, and full of adventure.`
        : `Meet ${name}, a one-of-a-kind friend whose gentle heart makes everyday moments feel warm and special.`;

  const mainStory = `${openers[tone]} ${intro} ${bridges[tone]} In the ${theme} world, ${name} shows that ${hook.charAt(0).toLowerCase() + hook.slice(1)}. ${closers[tone]}`;

  const mini1 =
    tone === "Playful"
      ? `${name} once turned an ordinary afternoon into a tiny celebration with a clever game and a big smile.`
      : tone === "Magical"
        ? `${name} once followed a golden breeze and discovered that even a quiet afternoon can feel enchanted.`
        : `${name} once turned an ordinary afternoon into a calm little memory that everyone wanted to keep.`;

  const mini2 =
    tone === "Playful"
      ? `${name} notices the little things others miss and always finds a fun way to make them shine.`
      : tone === "Magical"
        ? `${name} notices the smallest details and treats them like little treasures from a hidden story.`
        : `${name} notices the small things others forget and makes them feel important again.`;

  return {
    teaser,
    mainStory,
    mini1,
    mini2,
    slug: slugify(name),
  };
}

function buildContentPack(doll, storyData, publicBaseUrl) {
  const name = doll.name || "This doll";
  const theme = doll.theme_name || "Unassigned";
  const hook = doll.emotional_hook || `${name} brings warmth and wonder wherever she goes`;
  const intro = doll.short_intro || `${name} is a one-of-a-kind handmade doll with a story.`;
  const teaser = storyData.teaser || `Meet ${name}, a one-of-a-kind doll with a gentle story to tell.`;
  const publicSlug =
    typeof doll.slug === "string" && doll.slug.trim() ? doll.slug.trim() : slugify(name);
  const publicDollUrl = publicBaseUrl ? `${publicBaseUrl}/doll/${publicSlug}` : "";

  return {
    caption: `${name} ✨

${intro}

${teaser}

Discover ${name}'s world: ${publicDollUrl}

#MailleEtMerveille #DollWithAStory #HandmadeDoll`,
    hook: `Meet ${name}, a one-of-a-kind doll from the ${theme} world.`,
    blurb: `${name} is a handmade doll created to bring story, warmth, and imagination into everyday moments. ${hook}`,
    cta: `Discover ${name}'s world`,
  };
}

function generateV1ContentFromIdentity(doll = {}) {
  const name = selectPrimaryPhrase(doll.name, "This doll");
  const personality = selectPrimaryPhrase(doll.personality, "kind").toLowerCase();
  const rawWorld = selectPrimaryPhrase(doll.world, "a gentle little world");
  const world = rawWorld.toLowerCase() === "unassigned" ? "a gentle little world" : rawWorld;
  const mood = selectPrimaryPhrase(doll.mood, "calm").toLowerCase();

  return {
    intro_script: `Hello, ${name}. Welcome to ${world}. Let's enjoy a gentle ${mood} moment together.`,
    story_pages: [
      `${name} arrives in ${world}. ${name} looks around with a ${personality} smile. Everything feels soft and welcoming.`,
      `${name} feels a small ${mood} feeling inside. ${name} stays close to the good things nearby and takes a calm breath.`,
      `${name} chooses one gentle action. ${name} offers a kind hello and helps the moment feel brighter for everyone.`,
      `${name} ends the moment feeling safe and proud. ${world} feels warm, and ${name} is ready for the next little adventure.`,
    ],
    play_activity: {
      prompt: `What should ${name} do?`,
      choices: [
        {
          id: V1_PLAY_ACTIVITY_CHOICE_IDS[0],
          label: "Hold a soft blanket",
          result_text: `${name} holds a soft blanket and feels calm, cozy, and safe.`,
        },
        {
          id: V1_PLAY_ACTIVITY_CHOICE_IDS[1],
          label: "Do a little twirl",
          result_text: `${name} does a little twirl and the ${mood} moment turns playful and bright.`,
        },
        {
          id: V1_PLAY_ACTIVITY_CHOICE_IDS[2],
          label: "Wave to a new friend",
          result_text: `${name} waves to a new friend and ${world} feels even warmer.`,
        },
      ],
    },
  };
}

function mergeV1GeneratedContentWithFallback(value = {}, fallback = {}) {
  const normalized = buildLocalV1GeneratedContentState(value);
  const normalizedFallback = buildLocalV1GeneratedContentState(fallback);

  return {
    intro_script: readTrimmedString(
      normalized.intro_script,
      normalizedFallback.intro_script
    ),
    story_pages: normalizedFallback.story_pages.map((fallbackPage, index) =>
      readTrimmedString(normalized.story_pages[index], fallbackPage)
    ),
    play_activity: {
      prompt: readTrimmedString(
        normalized.play_activity.prompt,
        normalizedFallback.play_activity.prompt
      ),
      choices: normalizedFallback.play_activity.choices.map((fallbackChoice, index) => {
        const nextChoice = normalized.play_activity.choices[index] || {};

        return {
          id:
            nextChoice.id ||
            fallbackChoice.id ||
            V1_PLAY_ACTIVITY_CHOICE_IDS[index] ||
            `choice_${index + 1}`,
          label: readTrimmedString(nextChoice.label, fallbackChoice.label),
          result_text: readTrimmedString(
            nextChoice.result_text,
            fallbackChoice.result_text
          ),
        };
      }),
    },
  };
}

function deriveDollOperationsModel(doll = {}, contentManagementState) {
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

function compareOperationsCards(left, right) {
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

function operationsWorkspaceButtonLabel(workspace = "dashboard") {
  if (workspace === "pipeline") return "Open Pipeline";
  if (workspace === "content_studio") return "Open Content Studio";
  return "Open Dashboard";
}

function matchesOperationsFilter(operation, filter = "all") {
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

function compareOperationsByLastUpdated(left, right) {
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

function compareOperationsByName(left, right) {
  const nameDelta = (left?.name || "").localeCompare(right?.name || "");
  if (nameDelta !== 0) {
    return nameDelta;
  }

  return (left?.internal_id || "").localeCompare(right?.internal_id || "");
}

function sortOperationsList(items, sortMode = "urgency") {
  const nextItems = Array.isArray(items) ? [...items] : [];

  if (sortMode === "last_updated") {
    return nextItems.sort(compareOperationsByLastUpdated);
  }

  if (sortMode === "name") {
    return nextItems.sort(compareOperationsByName);
  }

  return nextItems.sort(compareOperationsCards);
}

function operationsQueueEmptyStateText(queueType = "production", filter = "all") {
  if (queueType === "production") {
    return filter === "production"
      ? "No dolls are waiting in Production right now. The production queue is clear."
      : "No dolls currently need production attention. Operators can focus elsewhere for now.";
  }

  return filter === "content"
    ? "No dolls are waiting in Content right now. The content queue is clear."
    : "No dolls currently need content attention. Operators can focus elsewhere for now.";
}

function operationsPassiveEmptyStateText(filter = "live") {
  return filter === "archived"
    ? "No archived dolls are on record yet. Archived dolls will appear here as a read-only reference list."
    : "No dolls are live yet. When content is marked live, those dolls will appear here for quick reference.";
}

function buildReadiness(identity, story, contentPack, order, publicUrl) {
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

export default function Page() {
  const adminVersion = buildAdminVersionInfo();
  const adminProtectionEnabled = Boolean(ADMIN_PASSWORD);
  const [isAuthenticated, setIsAuthenticated] = useState(!adminProtectionEnabled);
  const [authChecked, setAuthChecked] = useState(!adminProtectionEnabled);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [themes, setThemes] = useState(DEFAULT_THEMES);
  const [dolls, setDolls] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [newDollName, setNewDollName] = useState("");
  const [newArtistName, setNewArtistName] = useState("");
  const [newTheme, setNewTheme] = useState("Unassigned");

  const [identity, setIdentity] = useState({
    name: "",
    theme_name: "Unassigned",
    personality_traits: "",
    emotional_hook: "",
    social_hook: "",
    social_caption: "",
    social_cta: "",
    social_status: "draft",
    short_intro: "",
    image_url: "",
    color_palette: "",
    notable_features: "",
    expression_feel: "",
    character_world: "",
  });

  const [storyTone, setStoryTone] = useState("Gentle");
  const [story, setStory] = useState(emptyStoryState);
  const [storyGenerating, setStoryGenerating] = useState(false);
  const [storySaving, setStorySaving] = useState(false);
  const [storyVariations, setStoryVariations] = useState([]);
  const [selectedStoryVariationId, setSelectedStoryVariationId] = useState("");
  const [savedStorySnapshot, setSavedStorySnapshot] = useState(null);
  const [managedContentGenerating, setManagedContentGenerating] = useState(false);

  const [contentPack, setContentPack] = useState(emptyContentPackState);
  const [contentPackGenerating, setContentPackGenerating] = useState(false);
  const [contentPackSaving, setContentPackSaving] = useState(false);
  const [contentPackVariations, setContentPackVariations] = useState([]);
  const [selectedContentPackVariationId, setSelectedContentPackVariationId] = useState("");
  const [savedContentPackSnapshot, setSavedContentPackSnapshot] = useState(null);

  const [order, setOrder] = useState(emptyOrderState);
  const [socialGenerating, setSocialGenerating] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialVariations, setSocialVariations] = useState([]);
  const [selectedSocialVariationId, setSelectedSocialVariationId] = useState("");
  const [savedSocialSnapshot, setSavedSocialSnapshot] = useState(null);
  const [playActivity, setPlayActivity] = useState(emptyPlayActivityState);

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const [showQrRegenerateWarning, setShowQrRegenerateWarning] = useState(false);
  const [dangerAction, setDangerAction] = useState(null);
  const [dangerConfirmText, setDangerConfirmText] = useState("");
  const [dangerLoading, setDangerLoading] = useState("");
  const printCardRef = useRef(null);
  const slugLockRef = useRef({ id: null, legacyLockedSlug: "" });
  const pendingSelectedWorkspaceModeRef = useRef("");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("");
  const [activeStageView, setActiveStageView] = useState("");
  const [selectedWorkspaceMode, setSelectedWorkspaceMode] = useState("");
  const [operationsFilter, setOperationsFilter] = useState("all");
  const [operationsSort, setOperationsSort] = useState("urgency");
  const [commerceStatus, setCommerceStatus] = useState("draft");
  const [commerceSaving, setCommerceSaving] = useState(false);
  const [pipelineStageCompleting, setPipelineStageCompleting] = useState("");
  const [pipelineStageReopening, setPipelineStageReopening] = useState("");
  const [stageActionWarning, setStageActionWarning] = useState(null);
  const [contentManagementByDoll, setContentManagementByDoll] = useState({});
  const [generatedV1ContentByDoll, setGeneratedV1ContentByDoll] = useState({});
  const [generatedContentEditState, setGeneratedContentEditState] = useState(
    emptyGeneratedContentEditorState
  );
  const [generatedContentSavingState, setGeneratedContentSavingState] = useState(
    emptyGeneratedContentEditorState
  );
  const [introScriptDraft, setIntroScriptDraft] = useState("");
  const [storyPageDrafts, setStoryPageDrafts] = useState(["", "", "", ""]);
  const [playActivityDraft, setPlayActivityDraft] = useState(() =>
    buildEditablePlayActivityState()
  );

  const selected = useMemo(
    () => dolls.find((d) => d.id === selectedId) || dolls[0] || null,
    [dolls, selectedId]
  );

  const publicBaseUrl = getPublicBaseUrl();
  const savedSlug = typeof selected?.slug === "string" ? selected.slug.trim() : "";
  const selectedLockId = selected?.id || null;
  if (slugLockRef.current.id !== selectedLockId) {
    slugLockRef.current = {
      id: selectedLockId,
      legacyLockedSlug:
        !savedSlug && selected?.qr_code_url ? slugify(selected.name || selected.internal_id || "") : "",
    };
  }
  const legacyLockedSlug = slugLockRef.current.legacyLockedSlug || "";
  const slugLocked = Boolean(savedSlug || selected?.qr_code_url);
  const selectedSlug =
    savedSlug ||
    legacyLockedSlug ||
    slugify(identity.name || selected?.name || selected?.internal_id || "");
  const publicPath = selectedSlug ? `/doll/${selectedSlug}` : "";
  const publicUrl = selectedSlug && publicBaseUrl ? `${publicBaseUrl}${publicPath}` : "";
  const readiness = buildReadiness(identity, story, contentPack, order, publicUrl);
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
  const pipelineStageActionBusy = Boolean(pipelineStageCompleting || pipelineStageReopening);
  const currentWorkflowStageKey =
    currentOpenPipelineStage ||
    [...PIPELINE_STAGE_ORDER]
      .reverse()
      .find((stage) => selectedPipelineState?.[stage]?.status === "completed") ||
    "registered";
  const currentWorkflowStageLabel = PIPELINE_STAGE_LABELS[currentWorkflowStageKey] || "Registered";
  const currentWorkflowStageStatus =
    selectedPipelineState?.[currentWorkflowStageKey]?.status || "locked";
  const dollIdentityThemeRaw =
    identity.theme_name?.trim() || selected?.theme_name?.trim() || "";
  const dollIdentityTheme =
    dollIdentityThemeRaw && dollIdentityThemeRaw.toLowerCase() !== "unassigned"
      ? dollIdentityThemeRaw
      : "";
  const dollIdentityWorld = identity.character_world?.trim() || selected?.character_world?.trim() || "";
  const dollIdentityCollection = dollIdentityTheme || dollIdentityWorld || "Unassigned";
  const dollIdentityArtist = selected?.artist_name?.trim() || "";
  const dollIdentityArtistDisplay = dollIdentityArtist || "Unassigned";
  const dollIdentityArtistIsEmpty = !dollIdentityArtist;
  const dollIdentityWorkflowState = pipelineStageStateLabel(currentWorkflowStageStatus);
  const productionStageStatus = selectedPipelineState?.registered?.status || "locked";
  const characterStageStatus = selectedPipelineState?.character?.status || "locked";
  const contentStageStatus = selectedPipelineState?.content?.status || "locked";
  const gatewayStageStatus = selectedPipelineState?.gateway?.status || "locked";
  const isProductionEditable = isStageEditable(productionStageStatus);
  const isCharacterEditable = isStageEditable(characterStageStatus);
  const isContentEditable = isStageEditable(contentStageStatus);
  const isGatewayEditable = isStageEditable(gatewayStageStatus);
  const qrSalesStatus = effectiveSalesStatus;
  const qrAvailabilityStatus = legacyAvailabilityStatus;
  const qrIsSensitive =
    qrSalesStatus === "reserved" ||
    qrSalesStatus === "sold" ||
    qrAvailabilityStatus === "assigned";
  const dangerNeedsArchiveWarning = qrIsSensitive;
  const dangerNeedsTypedDelete = qrSalesStatus === "sold" || qrAvailabilityStatus === "assigned";
  const qrSensitivityLabel = qrIsSensitive ? "Sensitive" : "Editable";
  const qrSensitivityText = qrIsSensitive
    ? "Reserved, sold, or assigned dolls should only get a new QR when you are sure the owner can safely receive the updated link."
    : "This doll is still editable, so generating or regenerating the QR is safe.";
  const qrWarningMessage =
    qrSalesStatus === "sold"
      ? "This doll has already been sold. Regenerating the QR may break access for the owner."
      : qrSalesStatus === "reserved"
        ? "This doll has already been reserved. Regenerating the QR may break access for the customer."
        : "This doll has already been assigned. Regenerating the QR may break access for the owner.";
  const archiveWarningMessage =
    qrSalesStatus === "sold"
      ? "This doll has already been sold. Archiving it will keep the digital identity intact, but you should only do this if the owner can still reach the right page and QR."
      : qrSalesStatus === "reserved"
        ? "This doll has already been reserved. Archiving it will keep the digital identity intact, but you should confirm the customer will not lose access."
        : "This doll has already been assigned. Archiving it will keep the digital identity intact, but you should confirm the recipient will not lose access.";
  const deleteWarningMessage =
    qrSalesStatus === "sold"
      ? "This doll has already been sold. Deleting it will remove its digital identity, public page content, QR link, and order history."
      : qrSalesStatus === "reserved"
        ? "This doll has already been reserved. Deleting it will remove its digital identity, public page content, QR link, and order history."
        : qrAvailabilityStatus === "assigned"
          ? "This doll has already been assigned. Deleting it will remove its digital identity, public page content, QR link, and order history."
          : "This will permanently remove the doll, its digital identity, public page content, QR link, stories, content assets, and orders.";
  const selectedIsArchived = selected?.status === "archived";
  const hasQrIdentity = Boolean(qrDataUrl || selected?.qr_code_url || effectiveAccessStatus === "generated");
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
  const digitalHints = [
    !hasQrIdentity ? "Generate a QR code to activate this doll." : "",
    hasQrIdentity ? "This QR links the physical doll to its digital story page." : "",
    hasQrIdentity && qrIsSensitive ? "This QR may already be in use by the owner." : "",
  ].filter(Boolean);
  const dataQualityHints = [
    !selectedSlug ? "Add a public slug to enable the doll page and QR experience." : "",
  ].filter(Boolean);
  const selectedReadiness = useMemo(() => {
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
  }, [
    selected?.id,
    selected?.internal_id,
    selected?.image_url,
    selected?.universe_id,
    selected?.theme_name,
    selected?.story,
    selected?.story_main,
    selected?.qr_code_url,
    story.mainStory,
    contentPack.caption,
    contentPack.hook,
    contentPack.blurb,
    contentPack.cta,
    identity.social_hook,
    identity.social_caption,
    identity.social_cta,
    identity.color_palette,
    identity.notable_features,
    identity.personality_traits,
    identity.emotional_hook,
    identity.expression_feel,
    identity.character_world,
    identity.name,
    identity.theme_name,
    selectedSlug,
    publicPath,
    publicUrl,
    effectiveCommerceStatus,
  ]);
  // Gateway is the activation layer: digital identity plus commerce readiness.
  const gatewayReady =
    Boolean(selectedReadiness?.digital?.complete) &&
    Boolean(selectedReadiness?.commercial?.complete);
  const gatewayReadinessState = {
    complete: gatewayReady,
    missing: selectedReadiness?.digital?.complete
      ? selectedReadiness?.commercial?.missing || []
      : selectedReadiness?.digital?.missing || [],
  };
  const readinessOverviewItems = [
    { key: "production", label: "Production", state: selectedReadiness.production },
    { key: "character", label: "Character", state: selectedReadiness.character },
    { key: "content", label: "Content", state: selectedReadiness.content },
    { key: "digital", label: "Digital", state: selectedReadiness.digital },
    { key: "commercial", label: "Product Commerce", state: selectedReadiness.commercial },
  ];
  const productionWorkflowComplete =
    selectedReadiness.production.complete &&
    selectedReadiness.character.complete &&
    selectedReadiness.content.complete &&
    selectedReadiness.digital.complete;
  const overviewBlockingItems = readinessOverviewItems.filter(
    (item) => !item.state.complete && item.key !== "commercial"
  );
  const qrReady =
    selectedReadiness.production.complete &&
    selectedReadiness.character.complete &&
    selectedReadiness.content.complete;
  const qrReadinessMessage =
    "Complete Production, Character, and Content before generating a QR code.";
  const saleTransitionReadinessMessage =
    "Complete all readiness sections before confirming or progressing this order.";
  const currentDepartment = selected ? activeDepartment || "Overview" : "";
  const currentStageView = selected
    ? activeStageView || "overview"
    : "";
  const currentSelectedWorkspaceMode = selected
    ? selectedWorkspaceMode || "dashboard"
    : "";
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
  const workspaceNextStepMessage = activeStageNextStepMessage || globalWorkspaceNextStepMessage;
  const currentStageViewStatus =
    currentStageView && PIPELINE_STAGE_ORDER.includes(currentStageView)
      ? selectedPipelineState?.[currentStageView]?.status || "locked"
      : null;
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
  const showWorkflowGuidance =
    currentStageView !== "overview" && currentStageView !== "ready";
  const workflowFeedback = error
    ? {
        tone: "error",
        message: error,
      }
    : notice
      ? {
          tone: "success",
          message: notice,
        }
      : selectedIsArchived
        ? {
            tone: "muted",
            message:
              "This doll is archived. Its digital identity and related records are preserved, but it is no longer part of the active lifecycle.",
          }
        : null;
  const selectedContentManagement = useMemo(() => {
    if (!selected) {
      return DEFAULT_CONTENT_MANAGEMENT_STATE;
    }

    return contentManagementByDoll[selected.id] || buildLocalContentManagementState(selected);
  }, [
    contentManagementByDoll,
    selected?.id,
    selected?.generation_status,
    selected?.review_status,
    selected?.publish_status,
  ]);
  const hasContentPreview = Boolean(savedSlug || legacyLockedSlug);
  const contentPreviewHref = hasContentPreview ? publicUrl || publicPath : "";
  const contentAssetCompleteness = useMemo(() => {
    const items = [
      {
        key: "hero_image",
        label: "Hero image",
        complete: Boolean((identity.image_url || selected?.image_url || "").trim()),
      },
      {
        key: "story",
        label: "Story",
        complete: Boolean(
          story.teaser?.trim() ||
            story.mainStory?.trim() ||
            story.mini1?.trim() ||
            story.mini2?.trim() ||
            (typeof selected?.story_main === "string" && selected.story_main.trim()) ||
            (typeof selected?.story === "string" && selected.story.trim())
        ),
      },
      {
        key: "qr",
        label: "QR",
        complete: Boolean((qrDataUrl || selected?.qr_code_url || "").trim()),
      },
    ];
    const completeCount = items.filter((item) => item.complete).length;

    return {
      items,
      completeCount,
      total: items.length,
      percent: Math.round((completeCount / items.length) * 100),
    };
  }, [
    identity.image_url,
    qrDataUrl,
    selected?.id,
    selected?.image_url,
    selected?.qr_code_url,
    selected?.story,
    selected?.story_main,
    story.teaser,
    story.mainStory,
    story.mini1,
    story.mini2,
  ]);
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
  const selectedGeneratedV1Content = useMemo(() => {
    if (!selected) {
      return emptyV1GeneratedContentState();
    }

    if (generatedV1ContentByDoll[selected.id]) {
      return buildLocalV1GeneratedContentState(generatedV1ContentByDoll[selected.id]);
    }

    if (hasV1GeneratedContent(selected)) {
      return buildLocalV1GeneratedContentState({
        intro_script: selected.intro_script,
        story_pages: selected.story_pages,
        play_activity: selected.play_activity,
      });
    }

    return emptyV1GeneratedContentState();
  }, [
    generatedV1ContentByDoll,
    selected?.id,
    selected?.intro_script,
    selected?.story_pages,
    selected?.play_activity,
  ]);
  const contentManagementStateSummary = [
    formatStatusToken(selectedContentManagement.generation_status),
    formatStatusToken(selectedContentManagement.review_status),
    formatStatusToken(selectedContentManagement.publish_status),
  ].join(" / ");
  const selectedEditablePlayActivity = useMemo(
    () => buildEditablePlayActivityState(selectedGeneratedV1Content.play_activity),
    [selectedGeneratedV1Content.play_activity]
  );
  const selectedHasPlayActivityChoices = useMemo(
    () => hasPlayActivityChoiceContent(selectedGeneratedV1Content.play_activity.choices),
    [selectedGeneratedV1Content.play_activity.choices]
  );
  const operationsByDoll = useMemo(() => {
    const dollList = Array.isArray(dolls) ? dolls : [];

    return dollList
      .filter((doll) => Boolean(doll) && typeof doll === "object")
      .map((doll) => {
        try {
          return deriveDollOperationsModel(
            doll,
            contentManagementByDoll?.[doll?.id]
          );
        } catch {
          return deriveDollOperationsModel(
            {
              id: doll?.id || null,
              internal_id: doll?.internal_id || "",
              name: doll?.name || "Untitled doll",
              theme_name: doll?.theme_name || "Unassigned",
              status: doll?.status || "",
              updated_at: doll?.updated_at || "",
              created_at: doll?.created_at || "",
            },
            undefined
          );
        }
      });
  }, [dolls, contentManagementByDoll]);
  const operationsSummaryItems = useMemo(
    () => [
      {
        key: "total",
        label: "Total Dolls",
        value: operationsByDoll.length,
      },
      {
        key: "production_attention",
        label: "Production Attention",
        value: operationsByDoll.filter(
          (operation) => operation.attention_type === "production"
        ).length,
      },
      {
        key: "content_attention",
        label: "Content Attention",
        value: operationsByDoll.filter(
          (operation) => operation.attention_type === "content"
        ).length,
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
        value: operationsByDoll.filter((operation) => operation.content_bucket === "live")
          .length,
      },
    ],
    [operationsByDoll]
  );
  const filteredOperationsByDoll = useMemo(
    () =>
      sortOperationsList(
        operationsByDoll.filter(
          (operation) =>
            Boolean(operation) && matchesOperationsFilter(operation, operationsFilter)
        ),
        operationsSort
      ),
    [operationsByDoll, operationsFilter, operationsSort]
  );
  const productionQueueGroups = useMemo(() => {
    const operationsList = Array.isArray(filteredOperationsByDoll)
      ? filteredOperationsByDoll.filter(Boolean)
      : [];

    return OPERATIONS_PRODUCTION_QUEUE_BUCKET_ORDER.map((bucket) => ({
      bucket,
      items: sortOperationsList(
        operationsList.filter(
          (operation) =>
            operation?.attention_type === "production" &&
            operation?.production_bucket === bucket
        ),
        operationsSort
      ),
    })).filter((group) => group.items.length > 0);
  }, [filteredOperationsByDoll, operationsSort]);
  const contentQueueGroups = useMemo(() => {
    const operationsList = Array.isArray(filteredOperationsByDoll)
      ? filteredOperationsByDoll.filter(Boolean)
      : [];

    return OPERATIONS_CONTENT_QUEUE_BUCKET_ORDER.map((bucket) => ({
      bucket,
      items: sortOperationsList(
        operationsList.filter(
          (operation) =>
            operation?.attention_type === "content" &&
            operation?.content_bucket === bucket
        ),
        operationsSort
      ),
    })).filter((group) => group.items.length > 0);
  }, [filteredOperationsByDoll, operationsSort]);
  const dashboardRecommendedWorkspace =
    !selectedReadiness.overall
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
  const currentStorySignature = sectionStateSignature(buildStorySectionSnapshot(story));
  const currentContentPackSignature = sectionStateSignature(buildContentPackSectionSnapshot(contentPack));
  const currentSocialSignature = sectionStateSignature(buildSocialSectionSnapshot(identity));
  const savedStorySignature = savedStorySnapshot ? sectionStateSignature(savedStorySnapshot) : null;
  const savedContentPackSignature = savedContentPackSnapshot
    ? sectionStateSignature(savedContentPackSnapshot)
    : null;
  const savedSocialSignature = savedSocialSnapshot ? sectionStateSignature(savedSocialSnapshot) : null;
  const storyHasSavedSnapshot = savedStorySnapshot !== null;
  const contentPackHasSavedSnapshot = savedContentPackSnapshot !== null;
  const socialHasSavedSnapshot = savedSocialSnapshot !== null;
  const storyDirty = !storyHasSavedSnapshot || currentStorySignature !== savedStorySignature;
  const contentPackDirty =
    !contentPackHasSavedSnapshot || currentContentPackSignature !== savedContentPackSignature;
  const socialDirty = !socialHasSavedSnapshot || currentSocialSignature !== savedSocialSignature;
  const storySaveDisabled = storySaving || (!storyDirty && storyHasSavedSnapshot);
  const contentPackSaveDisabled = contentPackSaving || (!contentPackDirty && contentPackHasSavedSnapshot);
  const socialSaveDisabled = socialSaving || (!socialDirty && socialHasSavedSnapshot);
  const storySaveLabel = sectionSaveButtonLabel(
    "Save Story",
    storyDirty,
    storySaving,
    storyHasSavedSnapshot
  );
  const contentPackSaveLabel = sectionSaveButtonLabel(
    "Save Content Pack",
    contentPackDirty,
    contentPackSaving,
    contentPackHasSavedSnapshot
  );
  const socialSaveLabel = sectionSaveButtonLabel(
    "Save Social Content",
    socialDirty,
    socialSaving,
    socialHasSavedSnapshot
  );

  const savedQrUrl = selected?.qr_code_url || "";
  const qrStatus = !qrDataUrl
    ? "empty"
    : savedQrUrl && qrDataUrl === savedQrUrl
      ? "saved"
      : "generated";

  function buildAIGenerationPayload(tone = storyTone) {
    const liveThemeName = identity.theme_name?.trim() || selected?.theme_name || "";
    const universe =
      selected?.universe && typeof selected.universe === "object"
        ? selected.universe
        : {
            name:
              (typeof selected?.universe_name === "string" && selected.universe_name.trim()) ||
              (liveThemeName && liveThemeName !== "Unassigned" ? liveThemeName : ""),
            description:
              (typeof selected?.universe_description === "string" && selected.universe_description.trim()) ||
              (typeof selected?.theme_description === "string" && selected.theme_description.trim()) ||
              identity.short_intro?.trim() ||
              selected?.short_intro ||
              "",
            tone,
            environment_description:
              identity.character_world?.trim() ||
              selected?.character_world ||
              "",
          };

    return {
      name: identity.name?.trim() || selected?.name || "",
      theme_name: liveThemeName || "Unassigned",
      personality_traits:
        identity.personality_traits?.trim() ||
        selected?.personality_traits ||
        "",
      emotional_hook:
        identity.emotional_hook?.trim() ||
        selected?.emotional_hook ||
        "",
      expression_feel:
        identity.expression_feel?.trim() ||
        selected?.expression_feel ||
        "",
      character_world:
        identity.character_world?.trim() ||
        selected?.character_world ||
        "",
      color_palette:
        identity.color_palette?.trim() ||
        selected?.color_palette ||
        "",
      notable_features:
        identity.notable_features?.trim() ||
        selected?.notable_features ||
        "",
      universe,
    };
  }

  function buildManagedContentGenerationPayload() {
    const basePayload = buildAIGenerationPayload("Gentle");
    const themeName =
      typeof basePayload.theme_name === "string" ? basePayload.theme_name.trim() : "";
    const world =
      basePayload.character_world?.trim() ||
      (themeName && themeName.toLowerCase() !== "unassigned" ? themeName : "") ||
      "a gentle little world";
    const mood =
      basePayload.expression_feel?.trim() ||
      basePayload.emotional_hook?.trim() ||
      "calm";

    return {
      ...basePayload,
      personality: basePayload.personality_traits || "",
      world,
      mood,
    };
  }

  async function loadThemes() {
    if (!supabase) return;

    const { data } = await supabase.from("themes").select("name").order("name");
    const dbThemes = (data || []).map((x) => x.name).filter(Boolean);
    const merged = Array.from(new Set(["Unassigned", ...dbThemes, ...DEFAULT_THEMES]));
    setThemes(merged);
  }

  async function loadDolls() {
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const { data, error } = await supabase
      .from("dolls")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    const mapped = (data || []).map((d) =>
      withNormalizedPipelineState(
        {
          ...d,
          theme_name: d.theme_name || "Unassigned",
        },
        { timestamp: getPipelineNormalizationTimestamp(d) }
      )
    );

    setDolls(mapped);

    if (!selectedId && mapped.length) {
      setSelectedId(mapped[0].id);
    }
  }

  async function loadDetails(dollId) {
    if (!dollId) return;
    setError("");

    const doll = dolls.find((d) => d.id === dollId);
    const localGeneratedV1Content = generatedV1ContentByDoll[dollId]
      ? buildLocalV1GeneratedContentState(generatedV1ContentByDoll[dollId])
      : null;
    const persistedGeneratedV1Content =
      doll && hasV1GeneratedContent(doll)
        ? buildLocalV1GeneratedContentState({
            intro_script: doll.intro_script,
            story_pages: doll.story_pages,
            play_activity: doll.play_activity,
          })
        : null;
    const activeGeneratedV1Content = localGeneratedV1Content || persistedGeneratedV1Content;

    if (doll) {
      setCommerceStatus(normalizeCommerceStatus(doll.commerce_status));
      const nextIdentity = {
        name: doll.name || "",
        theme_name: doll.theme_name || "Unassigned",
        personality_traits: doll.personality_traits || "",
        emotional_hook: doll.emotional_hook || "",
        social_hook: doll.social_hook || "",
        social_caption: doll.social_caption || "",
        social_cta: doll.social_cta || "",
        social_status: doll.social_status || "draft",
        short_intro: activeGeneratedV1Content?.intro_script || doll.short_intro || "",
        image_url: doll.image_url || "",
        color_palette: doll.color_palette || "",
        notable_features: doll.notable_features || "",
        expression_feel: doll.expression_feel || "",
        character_world: doll.character_world || "",
      };

      setIdentity(nextIdentity);
      const hasSavedSocialSnapshot = Boolean(
        doll.social_hook?.trim() ||
          doll.social_caption?.trim() ||
          doll.social_cta?.trim() ||
          (typeof doll.social_status === "string" && doll.social_status.trim())
      );
      setSavedSocialSnapshot(
        hasSavedSocialSnapshot ? buildSocialSectionSnapshot(nextIdentity) : null
      );

      setQrDataUrl(doll.qr_code_url || "");
    } else {
      setCommerceStatus("draft");
      setQrDataUrl("");
    }

    const { data: stories } = await supabase
      .from("stories")
      .select("*")
      .eq("doll_id", dollId)
      .order("sequence_order", { ascending: true });

    const teaser = (stories || []).find((s) => s.type === "teaser")?.content || "";
    const mainStory = (stories || []).find((s) => s.type === "main")?.content || "";
    const minis = (stories || []).filter((s) => s.type === "mini");

    const persistedStory = {
      teaser,
      mainStory,
      mini1: minis[0]?.content || "",
      mini2: minis[1]?.content || "",
    };

    const nextStory = {
      teaser: activeGeneratedV1Content?.story_pages?.[0] || persistedStory.teaser,
      mainStory: activeGeneratedV1Content?.story_pages?.[1] || persistedStory.mainStory,
      mini1: activeGeneratedV1Content?.story_pages?.[2] || persistedStory.mini1,
      mini2: activeGeneratedV1Content?.story_pages?.[3] || persistedStory.mini2,
    };

    setStory(nextStory);
    setSavedStorySnapshot(
      (stories || []).length ? buildStorySectionSnapshot(persistedStory) : null
    );

    const { data: contentRows } = await supabase
      .from("content_assets")
      .select("*")
      .eq("doll_id", dollId);

    const caption = (contentRows || []).find((c) => c.type === "instagram_caption")?.content || "";
    const hook = (contentRows || []).find((c) => c.type === "promo_hook")?.content || "";
    const blurb = (contentRows || []).find((c) => c.type === "product_blurb")?.content || "";
    const cta = (contentRows || []).find((c) => c.type === "cta")?.content || "";

    const nextContentPack = { caption, hook, blurb, cta };

    setContentPack(nextContentPack);
    setSavedContentPackSnapshot(
      (contentRows || []).some((row) =>
        ["instagram_caption", "promo_hook", "product_blurb", "cta"].includes(row.type)
      )
        ? buildContentPackSectionSnapshot(nextContentPack)
        : null
    );

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("doll_id", dollId)
      .limit(1);

    if (orders && orders.length > 0) {
      setOrder({
        customer_name: orders[0].customer_name || "",
        contact_info: orders[0].contact_info || "",
        notes: orders[0].notes || "",
        order_status: orders[0].order_status || "new",
      });
    } else {
      setOrder({
        customer_name: "",
        contact_info: "",
        notes: "",
        order_status: "new",
      });
    }

    setPlayActivity(
      activeGeneratedV1Content?.play_activity
        ? activeGeneratedV1Content.play_activity
        : emptyPlayActivityState()
    );
  }

  useEffect(() => {
    if (!adminProtectionEnabled) {
      return;
    }

    const storedAuth = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    setIsAuthenticated(storedAuth === "true");
    setAuthChecked(true);
  }, [adminProtectionEnabled]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) {
      return;
    }

    loadThemes();
    loadDolls();
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    if (authChecked && isAuthenticated && selected) {
      loadDetails(selected.id);
    }
  }, [authChecked, isAuthenticated, selectedId, dolls.length]);

  useEffect(() => {
    setShowQrRegenerateWarning(false);
    setDangerAction(null);
    setDangerConfirmText("");
    setDangerLoading("");
    setPlayActivity(emptyPlayActivityState());
    setStoryVariations([]);
    setSelectedStoryVariationId("");
    setStorySaving(false);
    setContentPackGenerating(false);
    setContentPackSaving(false);
    setContentPackVariations([]);
    setSelectedContentPackVariationId("");
    setSocialGenerating(false);
    setSocialSaving(false);
    setSocialVariations([]);
    setSelectedSocialVariationId("");
    setCommerceSaving(false);
    setPipelineStageCompleting("");
    setPipelineStageReopening("");
    setStageActionWarning(null);
    setGeneratedContentEditState(emptyGeneratedContentEditorState());
    setGeneratedContentSavingState(emptyGeneratedContentEditorState());
    setIntroScriptDraft("");
    setStoryPageDrafts(["", "", "", ""]);
    setPlayActivityDraft(buildEditablePlayActivityState());
  }, [selectedId]);

  useEffect(() => {
    setActiveDepartment(selected ? "Overview" : "");
  }, [selected?.id]);

  useEffect(() => {
    setActiveStageView(selected ? "overview" : "");
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) {
      pendingSelectedWorkspaceModeRef.current = "";
      setSelectedWorkspaceMode("");
      return;
    }

    const nextWorkspace = pendingSelectedWorkspaceModeRef.current || "dashboard";
    setSelectedWorkspaceMode(nextWorkspace);
    pendingSelectedWorkspaceModeRef.current = "";
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.id) {
      return;
    }

    const derivedContentManagementState = buildLocalContentManagementState(selected);

    setContentManagementByDoll((prev) => {
      const existingState = prev[selected.id];

      if (!existingState) {
        return {
          ...prev,
          [selected.id]: derivedContentManagementState,
        };
      }

      if (
        existingState.generation_status === "generated" ||
        derivedContentManagementState.generation_status !== "generated"
      ) {
        return prev;
      }

      return {
        ...prev,
        [selected.id]: {
          ...existingState,
          generation_status: "generated",
        },
      };
    });
  }, [
    selected?.id,
    selected?.generation_status,
    selected?.review_status,
    selected?.publish_status,
    selected?.intro_script,
    selected?.story_pages,
    selected?.play_activity,
  ]);

  function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    if (!adminProtectionEnabled) {
      setIsAuthenticated(true);
      setAuthChecked(true);
      return;
    }

    if (loginPassword === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      setIsAuthenticated(true);
      setLoginPassword("");
      return;
    }

    setLoginError("Incorrect password.");
  }

  function handleLogout() {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    window.location.reload();
  }

  function openDollWorkspace(dollId, workspace = "dashboard") {
    const normalizedWorkspace = ["pipeline", "content_studio", "dashboard"].includes(
      workspace
    )
      ? workspace
      : "dashboard";

    if (!dollId) {
      return;
    }

    pendingSelectedWorkspaceModeRef.current = normalizedWorkspace;

    if (selected?.id === dollId) {
      setSelectedWorkspaceMode(normalizedWorkspace);
      pendingSelectedWorkspaceModeRef.current = "";
      return;
    }

    setSelectedId(dollId);
  }

  async function updateSelectedContentManagement(patch) {
    if (!selected?.id) return;

    // Update local state immediately
    setContentManagementByDoll((prev) => ({
      ...prev,
      [selected.id]: {
        ...selectedContentManagement,
        ...patch,
      },
    }));

    // Persist to Supabase
    if (!supabase) return;

    const { error: saveError } = await supabase
      .from("dolls")
      .update(patch)
      .eq("id", selected.id);

    if (saveError) {
      setError(
        `Content status updated locally but could not be saved. ${saveError.message}`
      );
    }
  }

  function applyManagedGeneratedContent(generatedContent) {
    if (!selected?.id) {
      return;
    }

    setGeneratedV1ContentByDoll((prev) => ({
      ...prev,
      [selected.id]: generatedContent,
    }));
    setIdentity((prev) => ({
      ...prev,
      short_intro: generatedContent.intro_script,
    }));
    setStory({
      teaser: generatedContent.story_pages[0],
      mainStory: generatedContent.story_pages[1],
      mini1: generatedContent.story_pages[2],
      mini2: generatedContent.story_pages[3],
    });
    setPlayActivity(generatedContent.play_activity);
    updateSelectedContentManagement({ generation_status: "generated" });
  }

  function setGeneratedStoryPageEditState(pageIndex, isEditing) {
    setGeneratedContentEditState((prev) => ({
      ...prev,
      story_pages: prev.story_pages.map((value, index) =>
        index === pageIndex ? isEditing : value
      ),
    }));
  }

  function setGeneratedStoryPageSavingState(pageIndex, isSaving) {
    setGeneratedContentSavingState((prev) => ({
      ...prev,
      story_pages: prev.story_pages.map((value, index) =>
        index === pageIndex ? isSaving : value
      ),
    }));
  }

  function startIntroScriptEditing() {
    setError("");
    setNotice("");
    setIntroScriptDraft(selectedGeneratedV1Content.intro_script);
    setGeneratedContentEditState((prev) => ({
      ...prev,
      intro_script: true,
    }));
  }

  function cancelIntroScriptEditing() {
    setIntroScriptDraft(selectedGeneratedV1Content.intro_script);
    setGeneratedContentEditState((prev) => ({
      ...prev,
      intro_script: false,
    }));
  }

  function startStoryPageEditing(pageIndex) {
    setError("");
    setNotice("");
    setStoryPageDrafts((prev) => {
      const nextDrafts = [...prev];
      nextDrafts[pageIndex] = selectedGeneratedV1Content.story_pages[pageIndex] || "";
      return nextDrafts;
    });
    setGeneratedStoryPageEditState(pageIndex, true);
  }

  function cancelStoryPageEditing(pageIndex) {
    setStoryPageDrafts((prev) => {
      const nextDrafts = [...prev];
      nextDrafts[pageIndex] = selectedGeneratedV1Content.story_pages[pageIndex] || "";
      return nextDrafts;
    });
    setGeneratedStoryPageEditState(pageIndex, false);
  }

  function startPlayActivityEditing() {
    setError("");
    setNotice("");
    setPlayActivityDraft(buildEditablePlayActivityState(selectedGeneratedV1Content.play_activity));
    setGeneratedContentEditState((prev) => ({
      ...prev,
      play_activity: true,
    }));
  }

  function cancelPlayActivityEditing() {
    setPlayActivityDraft(buildEditablePlayActivityState(selectedGeneratedV1Content.play_activity));
    setGeneratedContentEditState((prev) => ({
      ...prev,
      play_activity: false,
    }));
  }

  function buildNextGeneratedContent(patch = {}) {
    return buildLocalV1GeneratedContentState({
      intro_script: selectedGeneratedV1Content.intro_script,
      story_pages: selectedGeneratedV1Content.story_pages,
      play_activity: selectedGeneratedV1Content.play_activity,
      ...patch,
    });
  }

  async function saveGeneratedContentPatch(patch, nextGeneratedContent, successMessage) {
    if (!selected?.id) {
      return false;
    }

    if (!supabase) {
      setNotice("");
      setError("Supabase environment variables are missing.");
      return false;
    }

    setError("");
    setNotice("");

    const { error: saveError } = await supabase
      .from("dolls")
      .update(patch)
      .eq("id", selected.id);

    if (saveError) {
      setError(saveError.message);
      return false;
    }

    applyManagedGeneratedContent(nextGeneratedContent);
    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id
          ? {
              ...d,
              ...patch,
            }
          : d
      )
    );
    setNotice(successMessage);
    return true;
  }

  async function saveIntroScriptEdit() {
    const nextGeneratedContent = buildNextGeneratedContent({
      intro_script: introScriptDraft,
    });

    setGeneratedContentSavingState((prev) => ({
      ...prev,
      intro_script: true,
    }));

    try {
      const saved = await saveGeneratedContentPatch(
        { intro_script: nextGeneratedContent.intro_script },
        nextGeneratedContent,
        "Intro script saved."
      );

      if (saved) {
        setGeneratedContentEditState((prev) => ({
          ...prev,
          intro_script: false,
        }));
      }
    } finally {
      setGeneratedContentSavingState((prev) => ({
        ...prev,
        intro_script: false,
      }));
    }
  }

  async function saveStoryPageEdit(pageIndex) {
    const nextStoryPages = selectedGeneratedV1Content.story_pages.map((page, index) =>
      index === pageIndex ? storyPageDrafts[pageIndex] || "" : page
    );
    const nextGeneratedContent = buildNextGeneratedContent({
      story_pages: nextStoryPages,
    });

    setGeneratedStoryPageSavingState(pageIndex, true);

    try {
      const saved = await saveGeneratedContentPatch(
        { story_pages: nextGeneratedContent.story_pages },
        nextGeneratedContent,
        `Story page ${pageIndex + 1} saved.`
      );

      if (saved) {
        setGeneratedStoryPageEditState(pageIndex, false);
      }
    } finally {
      setGeneratedStoryPageSavingState(pageIndex, false);
    }
  }

  async function savePlayActivityEdit() {
    const nextPlayActivity = buildEditablePlayActivityState(playActivityDraft);
    const nextGeneratedContent = buildNextGeneratedContent({
      play_activity: nextPlayActivity,
    });

    setGeneratedContentSavingState((prev) => ({
      ...prev,
      play_activity: true,
    }));

    try {
      const saved = await saveGeneratedContentPatch(
        { play_activity: nextPlayActivity },
        nextGeneratedContent,
        "Play activity saved."
      );

      if (saved) {
        setGeneratedContentEditState((prev) => ({
          ...prev,
          play_activity: false,
        }));
      }
    } finally {
      setGeneratedContentSavingState((prev) => ({
        ...prev,
        play_activity: false,
      }));
    }
  }

  async function handleGenerateManagedContent() {
    if (!selected?.id) {
      return;
    }

    setError("");
    setNotice("");
    setManagedContentGenerating(true);

    const generationPayload = buildManagedContentGenerationPayload();
    const fallbackGeneratedContent = generateV1ContentFromIdentity({
      name: generationPayload.name,
      personality: generationPayload.personality,
      world: generationPayload.world,
      mood: generationPayload.mood,
    });

    let generatedContent = fallbackGeneratedContent;
    let usedFallback = false;
    let fallbackReason = "";

    try {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            provider: "anthropic",
            task: "v1_content",
            payload: generationPayload,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to generate content with AI.");
        }

        generatedContent = mergeV1GeneratedContentWithFallback(
          data?.result || {},
          fallbackGeneratedContent
        );
      } catch (err) {
        usedFallback = true;
        fallbackReason = err?.message || "Failed to generate content with AI.";
        generatedContent = fallbackGeneratedContent;
      }

      applyManagedGeneratedContent(generatedContent);

      if (!supabase) {
        setError(
          usedFallback
            ? `${fallbackReason} Deterministic local content was used instead, but Supabase is not configured.`
            : "Generated content is visible locally, but Supabase is not configured."
        );
        return;
      }

      const generatedContentPatch = {
        intro_script: generatedContent.intro_script,
        story_pages: generatedContent.story_pages,
        play_activity: generatedContent.play_activity,
      };
      const { error: saveError } = await supabase
        .from("dolls")
        .update(generatedContentPatch)
        .eq("id", selected.id);

      if (saveError) {
        setError(
          usedFallback
            ? `${fallbackReason} Deterministic local content was used instead, but it could not be saved. ${saveError.message}`
            : `Generated content is visible locally, but could not be saved. ${saveError.message}`
        );
        return;
      }

      setDolls((prev) =>
        prev.map((d) =>
          d.id === selected.id
            ? {
                ...d,
                ...generatedContentPatch,
              }
            : d
        )
      );
      setNotice(
        usedFallback
          ? "AI generation failed. Deterministic local content was used instead and saved to this doll."
          : "V1 content generated with AI and saved to this doll."
      );
    } finally {
      setManagedContentGenerating(false);
    }
  }

  function handlePreviewManagedContent() {
    if (!contentPreviewHref) {
      setNotice("");
      setError("No public preview route is available for this doll.");
      return;
    }

    setError("");
    window.open(contentPreviewHref, "_blank", "noopener,noreferrer");
  }

  async function handleApproveManagedContent() {
    if (selectedContentManagement.generation_status !== "generated") {
      return;
    }

    setError("");
    await updateSelectedContentManagement({ review_status: "approved" });
    setNotice("Content approved in the management layer.");
  }

  async function handlePublishManagedContent() {
    if (selectedContentManagement.review_status !== "approved") {
      return;
    }

    setError("");
    await updateSelectedContentManagement({ publish_status: "live" });
    setNotice("Content marked live in the management layer.");
  }

  async function handleUnpublishManagedContent() {
    if (selectedContentManagement.publish_status !== "live") {
      return;
    }

    setError("");
    await updateSelectedContentManagement({ publish_status: "hidden" });
    setNotice("Content hidden in the management layer.");
  }

  if (!authChecked) {
    return (
      <main style={{ background: "#f6f7fb", minHeight: "100vh", padding: 32, fontFamily: "Inter, Arial, sans-serif", color: "#0f172a" }}>
        <div style={{ minHeight: "calc(100vh - 64px)", display: "grid", placeItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 28 }}>
            <div style={{ letterSpacing: 3, fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              MAILLE & MERVEILLE
            </div>
            <h1 style={{ fontSize: 36, margin: 0, lineHeight: 1.08 }}>Doll Lifecycle System</h1>
            <p style={{ fontSize: 16, color: "#475569", marginTop: 12, marginBottom: 0 }}>
              Checking admin access...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (adminProtectionEnabled && !isAuthenticated) {
    return (
      <main style={{ background: "#f6f7fb", minHeight: "100vh", padding: 32, fontFamily: "Inter, Arial, sans-serif", color: "#0f172a" }}>
        <div style={{ minHeight: "calc(100vh - 64px)", display: "grid", placeItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 28 }}>
            <div style={{ letterSpacing: 3, fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              MAILLE & MERVEILLE
            </div>
            <h1 style={{ fontSize: 36, margin: 0, lineHeight: 1.08 }}>Admin Access</h1>
            <p style={{ fontSize: 16, color: "#475569", marginTop: 12 }}>
              Enter the admin password to continue.
            </p>

            {loginError ? (
              <div style={{ marginTop: 16, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: 14, borderRadius: 16 }}>
                {loginError}
              </div>
            ) : null}

            <form onSubmit={handleLogin} style={{ marginTop: 20 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  if (loginError) setLoginError("");
                }}
                style={inputStyle}
              />

              <button type="submit" style={{ ...primaryButton, width: "100%", marginTop: 16 }}>
                Enter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  async function createDoll() {
    setError("");
    setNotice("");

    const count = dolls.length + 1;
    const computedName = newDollName || `DOLL-${String(count).padStart(3, "0")}`;

    const pipelineTimestamp = createPipelineTimestamp();
    const defaultPipelineState = createDefaultPipelineState(pipelineTimestamp);
    const basePayload = {
      internal_id: `DOLL-${String(count).padStart(3, "0")}`,
      name: computedName,
      artist_name: newArtistName || null,
      theme_name: newTheme || "Unassigned",
      status: "new",
      availability_status: "available",
      sales_status: "not_sold",
      commerce_status: "draft",
      slug: slugify(computedName),
    };

    let insertResult = await supabase
      .from("dolls")
      .insert({
        ...basePayload,
        pipeline_state: defaultPipelineState,
      })
      .select()
      .single();

    if (insertResult.error && isMissingPipelineStateColumnError(insertResult.error)) {
      insertResult = await supabase.from("dolls").insert(basePayload).select().single();
    }

    const { data, error } = insertResult;

    if (error) {
      setError(error.message);
      return;
    }

    const next = withNormalizedPipelineState(
      {
        ...data,
        theme_name: data.theme_name || "Unassigned",
      },
      { timestamp: pipelineTimestamp }
    );

    setDolls((prev) => [...prev, next]);
    setSelectedId(next.id);
    setNewDollName("");
    setNewArtistName("");
    setNewTheme("Unassigned");
    setNotice("New doll added to the pipeline.");
  }

  async function saveIdentity() {
    if (!selected) return;

    const nextSocialSnapshot = buildSocialSectionSnapshot(identity);

    setSocialSaving(true);
    setError("");
    setNotice("");

    const patch = {
      name: identity.name,
      theme_name: identity.theme_name,
      personality_traits: identity.personality_traits,
      emotional_hook: identity.emotional_hook,
      social_hook: identity.social_hook,
      social_caption: identity.social_caption,
      social_cta: identity.social_cta,
      social_status: identity.social_status,
      short_intro: identity.short_intro,
      image_url: identity.image_url,
      color_palette: identity.color_palette,
      notable_features: identity.notable_features,
      expression_feel: identity.expression_feel,
      character_world: identity.character_world,
      status: selected.status === "new" ? "identity" : selected.status,
    };

    if (!slugLocked) {
      patch.slug = slugify(identity.name || selected.internal_id);
    }

    const { error } = await supabase.from("dolls").update(patch).eq("id", selected.id);

    if (error) {
      setError(error.message);
      setSocialSaving(false);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, ...patch } : d))
    );
    setSavedSocialSnapshot(nextSocialSnapshot);
    setNotice("Identity saved.");
    setSocialSaving(false);
  }

  async function saveStory() {
    if (!selected) return;

    const storyToSave = buildStorySectionSnapshot(story);

    setStorySaving(true);
    setError("");
    setNotice("");

    await supabase.from("stories").delete().eq("doll_id", selected.id);

    const inserts = [
      {
        doll_id: selected.id,
        type: "teaser",
        title: "Card teaser",
        content: storyToSave.teaser,
        sequence_order: 1,
      },
      {
        doll_id: selected.id,
        type: "main",
        title: "Main story",
        content: storyToSave.mainStory,
        sequence_order: 2,
      },
      {
        doll_id: selected.id,
        type: "mini",
        title: "Mini story 1",
        content: storyToSave.mini1,
        sequence_order: 3,
      },
      {
        doll_id: selected.id,
        type: "mini",
        title: "Mini story 2",
        content: storyToSave.mini2,
        sequence_order: 4,
      },
    ].filter((x) => (x.content || "").trim());

    const { error } = await supabase.from("stories").insert(inserts);

    if (error) {
      setError(error.message);
      setStorySaving(false);
      return;
    }

    const { error: dollError } = await supabase
      .from("dolls")
      .update({ status: "story" })
      .eq("id", selected.id);

    if (dollError) {
      setError(dollError.message);
      setStorySaving(false);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: "story" } : d))
    );
    setSavedStorySnapshot(storyToSave);
    setNotice("Story saved.");
    setStorySaving(false);
  }

  function applyStoryVariationToEditor(variation, nextPack = null) {
    if (!variation?.story_main) {
      return;
    }

    setSelectedStoryVariationId(variation.id || "");
    setStory((prev) => ({
      teaser: nextPack?.teaser ?? prev.teaser,
      mainStory: variation.story_main,
      mini1: nextPack?.mini1 ?? prev.mini1,
      mini2: nextPack?.mini2 ?? prev.mini2,
    }));
  }

  function applyContentPackVariationToEditor(variation) {
    if (
      !variation?.short_intro ||
      !variation?.content_blurb ||
      !variation?.promo_hook ||
      !variation?.cta
    ) {
      return;
    }

    setSelectedContentPackVariationId(variation.id || "");
    setContentPack({
      caption: variation.short_intro,
      hook: variation.promo_hook,
      blurb: variation.content_blurb,
      cta: variation.cta,
    });
  }

  function applySocialVariationToEditor(variation) {
    if (!variation?.social_hook || !variation?.social_caption || !variation?.social_cta) {
      return;
    }

    setSelectedSocialVariationId(variation.id || "");
    setIdentity((prev) => ({
      ...prev,
      social_hook: variation.social_hook,
      social_caption: variation.social_caption,
      social_cta: variation.social_cta,
    }));
  }

  async function applyTone(tone) {
    setStoryTone(tone);
    if (!selected) return;

    setError("");
    setNotice("");
    setStoryGenerating(true);

    const pack = buildStoryPack({ ...selected, ...identity }, tone);
    const payload = buildAIGenerationPayload(tone);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "anthropic",
          task: "story",
          payload,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate story.");
      }

      const nextStoryVariations = readStoryVariationCandidates(data?.result);
      const generatedMainStory =
        nextStoryVariations[0]?.story_main ||
        (typeof data?.result?.story_main === "string"
          ? data.result.story_main.trim()
          : "");

      if (!generatedMainStory) {
        throw new Error("Story generation returned an empty result.");
      }

      const resolvedStoryVariations =
        nextStoryVariations.length >= 1
          ? nextStoryVariations
          : [
              {
                id: "v1",
                label: "Version 1",
                story_main: generatedMainStory,
              },
            ];

      setStoryVariations(resolvedStoryVariations);
      applyStoryVariationToEditor(resolvedStoryVariations[0], pack);

      setNotice(`${tone} story pack generated.`);
    } catch (err) {
      setError(err?.message || "Failed to generate story.");
    } finally {
      setStoryGenerating(false);
    }
  }

  /*
  Legacy progression control disabled.
  Workflow progression is frozen to pipeline_state stage actions only.
  async function advanceStage() {
    if (!selected) return;

    setError("");
    setNotice("");

    const currentStage = Math.min(Math.max(Math.round(effectiveProductionStage || 1), 1), PRODUCTION_STAGES.length);

    if (currentStage >= PRODUCTION_STAGES.length) {
      setNotice(`This doll is already at Stage ${currentStage}: ${pipelineStageLabel}.`);
      return;
    }

    const nextStageValue = currentStage + 1;
    const nextStage = PRODUCTION_STAGES.find((stage) => stage.value === nextStageValue);

    if (!nextStage) {
      setError("Unable to determine the next production stage.");
      return;
    }

    const { error } = await supabase
      .from("dolls")
      .update({ production_stage: nextStage.value })
      .eq("id", selected.id);

    if (error) {
      setError(error.message);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, production_stage: nextStage.value } : d))
    );

    setNotice(`Advanced production stage to ${nextStage.value} - ${nextStage.label}.`);
  }
  */

  async function completePipelineStage(stage) {
    if (!selected) return;
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setError("");
    setNotice("");

    const openStage = getCurrentOpenPipelineStage(selectedPipelineState);
    if (!openStage || openStage !== stage) {
      setError("Only the current open stage can be completed.");
      return;
    }

    const stageReadiness = getPipelineStageReadinessState(stage, selectedReadiness, {
      gateway: gatewayReadinessState,
    });
    if (!stageReadiness?.complete) {
      setError(buildPipelineStageBlockedMessage(stage, stageReadiness));
      return;
    }

    const nextPipelineState = completePipelineStageTransition(selectedPipelineState, stage);
    const nextStage = getNextPipelineStage(stage);

    setPipelineStageCompleting(stage);

    const { error: pipelineError } = await supabase
      .from("dolls")
      .update({ pipeline_state: nextPipelineState })
      .eq("id", selected.id);

    if (pipelineError && !isMissingPipelineStateColumnError(pipelineError)) {
      setError(pipelineError.message);
      setPipelineStageCompleting("");
      return;
    }

    const pipelineStatePersisted = !pipelineError;

    setDolls((prev) =>
      prev.map((d) => {
        if (d.id !== selected.id) return d;
        return syncDollRecordPipelineState(d, nextPipelineState, {
          persisted: pipelineStatePersisted,
        });
      })
    );

    setNotice(
      nextStage
        ? `${PIPELINE_STAGE_LABELS[stage]} completed. ${PIPELINE_STAGE_LABELS[nextStage]} is now open.`
        : `${PIPELINE_STAGE_LABELS[stage]} completed.`
    );
    setPipelineStageCompleting("");
  }

  async function reopenPipelineStage(stage) {
    if (!selected) return;
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const nextPipelineState = reopenPipelineStageTransition(selectedPipelineState, stage);
    if (isSamePipelineState(nextPipelineState, selectedPipelineState)) {
      return;
    }

    setError("");
    setNotice("");
    setPipelineStageReopening(stage);

    const { error: pipelineError } = await supabase
      .from("dolls")
      .update({ pipeline_state: nextPipelineState })
      .eq("id", selected.id);

    if (pipelineError && !isMissingPipelineStateColumnError(pipelineError)) {
      setError(pipelineError.message);
      setPipelineStageReopening("");
      return;
    }

    const pipelineStatePersisted = !pipelineError;
    const downstreamStage = getNextPipelineStage(stage);

    setDolls((prev) =>
      prev.map((d) => {
        if (d.id !== selected.id) return d;
        return syncDollRecordPipelineState(d, nextPipelineState, {
          persisted: pipelineStatePersisted,
        });
      })
    );

    setNotice(
      downstreamStage
        ? `${PIPELINE_STAGE_LABELS[stage]} reopened. Later stages were locked.`
        : `${PIPELINE_STAGE_LABELS[stage]} reopened.`
    );
    setPipelineStageReopening("");
  }

  function requestReopenPipelineStage(stage) {
    if (!selected || pipelineStageActionBusy) return;

    const nextPipelineState = reopenPipelineStageTransition(selectedPipelineState, stage);
    if (isSamePipelineState(nextPipelineState, selectedPipelineState)) {
      return;
    }

    const affectedStages = getDownstreamPipelineStages(stage).filter((downstreamStage) => {
      const currentStatus = selectedPipelineState?.[downstreamStage]?.status;
      const nextStatus = nextPipelineState?.[downstreamStage]?.status;
      return currentStatus !== nextStatus && nextStatus === "locked";
    });

    setStageActionWarning({
      type: "reopen",
      stage,
      affectedStages,
    });
  }

  async function confirmStageActionWarning() {
    const warning = stageActionWarning;
    if (!warning) return;

    setStageActionWarning(null);

    if (warning.type === "reopen") {
      await reopenPipelineStage(warning.stage);
    }
  }

  function generateDraft() {
    handleGenerateManagedContent();
  }

  async function activateDigitalLayer() {
    if (!selected) return;

    const nextSlug = savedSlug || slugify(identity.name || selected.name || selected.internal_id);
    const patch = slugLocked
      ? { status: "digital" }
      : { slug: nextSlug, status: "digital" };

    const { error } = await supabase
      .from("dolls")
      .update(patch)
      .eq("id", selected.id);

    if (error) {
      setError(error.message);
      return;
    }

    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, ...patch } : d
      )
    );

    setNotice("Digital layer activated.");
  }

  async function createQrCodeDataUrl() {
    if (!publicUrl) {
      setError("No public URL available for this doll.");
      return null;
    }

    try {
      return await QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    } catch (err) {
      setError(err?.message || "Failed to generate QR code.");
      return null;
    }
  }

  function ensureQrGenerationReady() {
    if (qrReady) {
      return true;
    }

    setNotice("");
    setError(qrReadinessMessage);
    return false;
  }

  async function generateQrCode() {
    if (!selected) return false;

    setError("");
    setNotice("");

    if (!ensureQrGenerationReady()) {
      return false;
    }

    const dataUrl = await createQrCodeDataUrl();
    if (!dataUrl) {
      return false;
    }

    setQrDataUrl(dataUrl);

    const saved = await uploadQrToSupabase(dataUrl);
    if (saved) {
      setNotice("QR code generated and linked to this doll.");
    }

    return saved;
  }

  function downloadQrCode() {
    if (!qrDataUrl || !selected) {
      setError("Generate a QR code first.");
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${selectedSlug || selected.internal_id || "doll"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice("QR code downloaded.");
  }

  async function downloadPrintCard() {
    if (!printCardRef.current || !selected) {
      setError("No print card available to download.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const dataUrl = await toPng(printCardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${selectedSlug || selected.internal_id || "doll"}-print-card.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotice("Print card downloaded.");
    } catch (err) {
      console.error(err);
      setError("Failed to generate print card download.");
    }
  }

  async function uploadQrToSupabase(qrSource = qrDataUrl, forceRefresh = false) {
    if (!qrSource || !selected) {
      setError("Generate a QR code first.");
      return false;
    }

    setQrUploading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(qrSource);
      const blob = await response.blob();

      const filePath = `qr-codes/${selectedSlug || selected.internal_id}.png`;

      const { error: uploadError } = await supabase.storage
        .from("doll-assets")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("doll-assets")
        .getPublicUrl(filePath);

      const publicQrUrl = data?.publicUrl || "";
      const storedQrUrl =
        publicQrUrl && forceRefresh ? `${publicQrUrl}?v=${Date.now()}` : publicQrUrl;

      const { error: updateError } = await supabase
        .from("dolls")
        .update({ qr_code_url: storedQrUrl })
        .eq("id", selected.id);

      if (updateError) {
        throw updateError;
      }

      setDolls((prev) =>
        prev.map((d) =>
          d.id === selected.id ? { ...d, qr_code_url: storedQrUrl } : d
        )
      );

      setQrDataUrl(storedQrUrl);
      setNotice("QR code uploaded and linked to this doll.");
      return true;
    } catch (err) {
      setError(err?.message || "Failed to upload QR code.");
      return false;
    } finally {
      setQrUploading(false);
    }
  }

  async function regenerateSavedQrCode() {
    if (!selected) return;

    setError("");
    setNotice("");

    if (!ensureQrGenerationReady()) {
      return;
    }

    const dataUrl = await createQrCodeDataUrl();
    if (!dataUrl) {
      return;
    }

    setQrDataUrl(dataUrl);

    const saved = await uploadQrToSupabase(dataUrl, true);
    if (saved) {
      setNotice("QR code regenerated and linked to this doll.");
    }
  }

  function requestQrRegeneration() {
    if (!ensureQrGenerationReady()) {
      return;
    }

    if (!savedQrUrl) {
      generateQrCode();
      return;
    }

    if (qrIsSensitive) {
      setShowQrRegenerateWarning(true);
      return;
    }

    regenerateSavedQrCode();
  }

  async function confirmQrRegeneration() {
    setShowQrRegenerateWarning(false);

    if (!ensureQrGenerationReady()) {
      return;
    }

    await regenerateSavedQrCode();
  }

  async function archiveDoll() {
    if (!selected || !supabase) return;

    setDangerLoading("archive");
    setError("");
    setNotice("");

    const { error } = await supabase
      .from("dolls")
      .update({ status: "archived" })
      .eq("id", selected.id);

    if (error) {
      setError(error.message);
      setDangerLoading("");
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: "archived" } : d))
    );
    setDangerAction(null);
    setDangerLoading("");
    setNotice("Doll archived. Its digital identity and related records remain intact.");
  }

  function requestArchiveDoll() {
    if (dangerNeedsArchiveWarning) {
      setDangerAction("archive");
      return;
    }

    archiveDoll();
  }

  function requestPermanentDelete() {
    setDangerAction("delete");
    setDangerConfirmText("");
  }

  async function deleteDollPermanently() {
    if (!selected || !supabase) return;
    if (dangerNeedsTypedDelete && dangerConfirmText !== "DELETE") {
      setError('Type DELETE to confirm permanent removal for this doll.');
      return;
    }

    setDangerLoading("delete");
    setError("");
    setNotice("");

    const storagePaths = Array.from(
      new Set(
        [extractDollAssetPath(selected.qr_code_url), extractDollAssetPath(selected.image_url)].filter(Boolean)
      )
    );

    if (storagePaths.length) {
      const { error: storageError } = await supabase.storage.from("doll-assets").remove(storagePaths);
      if (storageError) {
        setError(`Could not remove stored QR or image files. ${storageError.message}`);
        setDangerLoading("");
        return;
      }
    }

    const { error: storiesError } = await supabase.from("stories").delete().eq("doll_id", selected.id);
    if (storiesError) {
      setError(storiesError.message);
      setDangerLoading("");
      return;
    }

    const { error: contentError } = await supabase
      .from("content_assets")
      .delete()
      .eq("doll_id", selected.id);
    if (contentError) {
      setError(contentError.message);
      setDangerLoading("");
      return;
    }

    const { error: ordersError } = await supabase.from("orders").delete().eq("doll_id", selected.id);
    if (ordersError) {
      setError(ordersError.message);
      setDangerLoading("");
      return;
    }

    const deletedId = selected.id;
    const nextSelected = dolls.find((d) => d.id !== deletedId) || null;
    const { error: dollError } = await supabase.from("dolls").delete().eq("id", deletedId);
    if (dollError) {
      setError(dollError.message);
      setDangerLoading("");
      return;
    }

    setDolls((prev) => prev.filter((d) => d.id !== deletedId));
    setSelectedId(nextSelected?.id || null);
    setQrDataUrl("");
    setStory(emptyStoryState());
    setContentPack(emptyContentPackState());
    setOrder(emptyOrderState());
    setDangerAction(null);
    setDangerConfirmText("");
    setDangerLoading("");
    setNotice("Doll permanently deleted. Its linked content, orders, QR, and image files were cleaned up.");
  }

  async function uploadImage(file) {
    if (!file || !selected) return;

    setError("");
    setNotice("Uploading image...");

    const filePath = `dolls/${selected.id}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("doll-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("doll-assets")
      .getPublicUrl(filePath);

    const publicImageUrl = data?.publicUrl || "";

    const { error: updateError } = await supabase
      .from("dolls")
      .update({ image_url: publicImageUrl })
      .eq("id", selected.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setIdentity((prev) => ({ ...prev, image_url: publicImageUrl }));
    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, image_url: publicImageUrl } : d
      )
    );

    setNotice("Image uploaded.");
  }

  async function generateContentPack() {
    if (!selected) return;

    setError("");
    setNotice("");
    setContentPackGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "anthropic",
          task: "content_pack",
          payload: buildAIGenerationPayload(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate content pack.");
      }

      const result = data?.result || {};
      const nextContentPackVariations = readContentPackVariationCandidates(result);
      const nextContentPack = {
        caption: typeof result.short_intro === "string" ? result.short_intro.trim() : "",
        hook: typeof result.promo_hook === "string" ? result.promo_hook.trim() : "",
        blurb: typeof result.content_blurb === "string" ? result.content_blurb.trim() : "",
        cta: typeof result.cta === "string" ? result.cta.trim() : "",
      };

      if (!nextContentPack.caption || !nextContentPack.hook || !nextContentPack.blurb || !nextContentPack.cta) {
        throw new Error("Content pack generation returned incomplete data.");
      }

      const resolvedContentPackVariations =
        nextContentPackVariations.length >= 1
          ? nextContentPackVariations
          : [
              {
                id: "v1",
                label: "Version 1",
                short_intro: nextContentPack.caption,
                content_blurb: nextContentPack.blurb,
                promo_hook: nextContentPack.hook,
                cta: nextContentPack.cta,
              },
            ];

      setContentPackVariations(resolvedContentPackVariations);
      applyContentPackVariationToEditor(resolvedContentPackVariations[0]);
      setNotice("Content pack generated.");
    } catch (err) {
      setError(err?.message || "Failed to generate content pack.");
    } finally {
      setContentPackGenerating(false);
    }
  }

  async function generateSocialContent() {
    if (!selected) return;

    setError("");
    setNotice("");
    setSocialGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "anthropic",
          task: "social",
          payload: buildAIGenerationPayload(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate social content.");
      }

      const result = data?.result || {};
      const nextSocialVariations = readSocialVariationCandidates(result);
      const nextSocialContent = {
        social_hook: typeof result.social_hook === "string" ? result.social_hook.trim() : "",
        social_caption:
          typeof result.social_caption === "string" ? result.social_caption.trim() : "",
        social_cta: typeof result.social_cta === "string" ? result.social_cta.trim() : "",
      };

      if (!nextSocialContent.social_hook || !nextSocialContent.social_caption || !nextSocialContent.social_cta) {
        throw new Error("Social generation returned incomplete data.");
      }

      const resolvedSocialVariations =
        nextSocialVariations.length >= 1
          ? nextSocialVariations
          : [
              {
                id: "v1",
                label: "Version 1",
                social_hook: nextSocialContent.social_hook,
                social_caption: nextSocialContent.social_caption,
                social_cta: nextSocialContent.social_cta,
              },
            ];

      setSocialVariations(resolvedSocialVariations);
      applySocialVariationToEditor(resolvedSocialVariations[0]);
      setNotice("Social content generated.");
    } catch (err) {
      setError(err?.message || "Failed to generate social content.");
    } finally {
      setSocialGenerating(false);
    }
  }

  async function saveContentPack() {
    if (!selected) return;

    const contentPackToSave = buildContentPackSectionSnapshot(contentPack);

    setContentPackSaving(true);
    setError("");
    setNotice("");

    await supabase
      .from("content_assets")
      .delete()
      .eq("doll_id", selected.id)
      .in("type", ["instagram_caption", "promo_hook", "product_blurb", "cta"]);

    const inserts = [
      {
        doll_id: selected.id,
        type: "instagram_caption",
        title: "Instagram Caption",
        content: contentPackToSave.caption,
        platform: "instagram",
        status: "draft",
      },
      {
        doll_id: selected.id,
        type: "promo_hook",
        title: "Promo Hook",
        content: contentPackToSave.hook,
        platform: "internal",
        status: "draft",
      },
      {
        doll_id: selected.id,
        type: "product_blurb",
        title: "Product Blurb",
        content: contentPackToSave.blurb,
        platform: "internal",
        status: "draft",
      },
      {
        doll_id: selected.id,
        type: "cta",
        title: "CTA",
        content: contentPackToSave.cta,
        platform: "internal",
        status: "draft",
      },
    ].filter((x) => (x.content || "").trim());

    const { error } = await supabase.from("content_assets").insert(inserts);

    if (error) {
      setError(error.message);
      setContentPackSaving(false);
      return;
    }

    const { error: dollError } = await supabase
      .from("dolls")
      .update({ status: "content" })
      .eq("id", selected.id);

    if (dollError) {
      setError(dollError.message);
      setContentPackSaving(false);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: "content" } : d))
    );

    setSavedContentPackSnapshot(contentPackToSave);
    setNotice("Content pack saved.");
    setContentPackSaving(false);
  }

  async function saveCommerceStatus() {
    if (!selected) return;

    setError("");
    setNotice("");
    setCommerceSaving(true);

    const nextCommerceStatus = normalizeCommerceStatus(commerceStatus);
    const { error } = await supabase
      .from("dolls")
      .update({ commerce_status: nextCommerceStatus })
      .eq("id", selected.id);

    if (error) {
      setError(error.message);
      setCommerceSaving(false);
      return;
    }

    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id
          ? {
              ...d,
              commerce_status: nextCommerceStatus,
            }
          : d
      )
    );
    setCommerceStatus(nextCommerceStatus);
    setNotice("Product commerce status saved.");
    setCommerceSaving(false);
  }

  async function saveOrder() {
    if (!selected) return;

    setError("");
    setNotice("");

    const nextSalesStatus = order.order_status === "delivered" ? "sold" : "reserved";
    const saleTransitionBlocked =
      !selectedReadiness.overall &&
      (nextSalesStatus !== effectiveSalesStatus || selected.status !== "sales");

    await supabase.from("orders").delete().eq("doll_id", selected.id);

    const { error } = await supabase.from("orders").insert({
      doll_id: selected.id,
      customer_name: order.customer_name,
      contact_info: order.contact_info,
      order_status: order.order_status,
      notes: order.notes,
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (saleTransitionBlocked) {
      setError(`Order details saved, but ${saleTransitionReadinessMessage.toLowerCase()}`);
      return;
    }

    await supabase
      .from("dolls")
      .update({
        sales_status: nextSalesStatus,
        status: "sales",
      })
      .eq("id", selected.id);

    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id
          ? {
              ...d,
              sales_status: nextSalesStatus,
              status: "sales",
            }
          : d
      )
    );

    setNotice("Order saved.");
  }
  async function copyToClipboard(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(successMessage);
    } catch {
      setError("Clipboard copy failed.");
    }
  }

  const productionDepartmentContent = (
    <div style={{ marginTop: 14, display: "grid", gap: 20 }}>
      <fieldset
        disabled={!isProductionEditable}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          minInlineSize: 0,
          display: "grid",
          gap: 18,
          opacity: isProductionEditable ? 1 : 0.84,
        }}
      >
        <div className="doll-identity-card" style={dollIdentityCardStyle}>
          <div style={dollIdentityHeaderRowStyle}>
            <div style={dollIdentityLeadStyle}>
              <div style={dollIdentityPrimaryStyle}>
                <div style={dollIdentityNameStyle}>{selected?.name || "Untitled doll"}</div>
                <div style={dollIdentitySupportingInfoStyle}>
                  <div style={dollIdentityIdStyle}>{selected?.internal_id || "Not assigned"}</div>
                  <div aria-hidden="true" style={dollIdentityInfoDividerStyle} />
                  <div style={dollIdentityThemeStyle}>{dollIdentityCollection}</div>
                </div>
              </div>
            </div>
          </div>

          <div aria-hidden="true" style={dollIdentityDividerStyle} />

          <div className="doll-identity-meta-strip" style={dollIdentityMetaStripStyle}>
            <div style={dollIdentityMetaStyle}>
              <div style={dollIdentityMetaLabelStyle}>Artist</div>
              <div style={dollIdentityMetaValueStyle(dollIdentityArtistIsEmpty)}>
                {dollIdentityArtistDisplay}
              </div>
              {dollIdentityArtistIsEmpty ? (
                <div style={dollIdentityMetaHintStyle}>Assignment pending</div>
              ) : null}
            </div>

            <div style={dollIdentityMetaStyle}>
              <div style={dollIdentityMetaLabelStyle}>Collection</div>
              <div style={dollIdentityMetaValueStyle(dollIdentityCollection === "Unassigned")}>
                {dollIdentityCollection}
              </div>
            </div>

            <div style={dollIdentityStatusStyle}>
              <div style={dollIdentityStageBadgeStyle(currentWorkflowStageStatus)}>
                {currentWorkflowStageLabel}
              </div>
              <div style={dollIdentityStatusStateStyle(currentWorkflowStageStatus)}>
                {dollIdentityWorkflowState}
              </div>
            </div>
          </div>
        </div>

        <div style={digitalCardStyle}>
          <div style={subduedSectionLabelStyle}>Physical Doll</div>
          <div style={{ color: "#64748b", fontSize: 15, marginTop: -2, marginBottom: 14 }}>
            Define the physical appearance of the doll.
          </div>
          <div style={{ ...subduedSectionLabelStyle, marginBottom: 12 }}>Visual Block</div>

          <div style={visualPlaceholderStyle}>
            <div style={{ width: "100%" }}>
              {identity.image_url ? (
                <img
                  src={identity.image_url}
                  alt="Doll"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    objectFit: "cover",
                    maxHeight: 360,
                  }}
                />
              ) : (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>No image yet</div>
                  <div style={{ fontSize: 14, color: "#64748b" }}>
                    Upload a doll image
                  </div>
                </div>
              )}

              {!hasImage ? (
                <div style={inlineValidationHintStyle}>
                  Add a doll image to complete production.
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                style={{ marginTop: 12 }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await uploadImage(file);
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={contentCardStyle}>
            <label style={labelStyle}>Color Palette</label>
            <input
              value={identity.color_palette}
              onChange={(e) => setIdentity({ ...identity, color_palette: e.target.value })}
              style={inputStyle}
            />
            {!identity.color_palette?.trim() ? (
              <div style={inlineValidationHintStyle}>
                Add a color palette.
              </div>
            ) : null}
          </div>

          <div style={contentCardStyle}>
            <label style={labelStyle}>Notable Features</label>
            <textarea
              value={identity.notable_features}
              onChange={(e) => {
                autoResizeTextarea(e.currentTarget);
                setIdentity({ ...identity, notable_features: e.target.value });
              }}
              ref={(node) => autoResizeTextarea(node)}
              style={{ ...inputStyle, minHeight: 160, resize: "none", overflow: "hidden" }}
            />
            {!identity.notable_features?.trim() ? (
              <div style={inlineValidationHintStyle}>
                Describe the key physical features.
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ paddingTop: 4 }}>
          <button onClick={saveIdentity} style={primaryButton}>Save Production Details</button>
        </div>
      </fieldset>
    </div>
  );
  const characterDepartmentContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <fieldset
        disabled={!isCharacterEditable}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          minInlineSize: 0,
          display: "grid",
          gap: 16,
          opacity: isCharacterEditable ? 1 : 0.84,
        }}
      >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Theme</label>
          <select value={identity.theme_name} onChange={(e) => setIdentity({ ...identity, theme_name: e.target.value })} style={inputStyle}>
            {themes.map((theme) => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Personality traits</label>
          <input value={identity.personality_traits} onChange={(e) => setIdentity({ ...identity, personality_traits: e.target.value })} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Emotional hook</label>
          <input value={identity.emotional_hook} onChange={(e) => setIdentity({ ...identity, emotional_hook: e.target.value })} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Expression Feel</label>
          <input value={identity.expression_feel} onChange={(e) => setIdentity({ ...identity, expression_feel: e.target.value })} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Short intro</label>
        <textarea
          value={identity.short_intro}
          onChange={(e) => setIdentity({ ...identity, short_intro: e.target.value })}
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Character World</label>
        <textarea
          value={identity.character_world}
          onChange={(e) => setIdentity({ ...identity, character_world: e.target.value })}
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <button onClick={saveIdentity} style={primaryButton}>Save Identity</button>
      </div>
      </fieldset>
    </div>
  );
  const contentDepartmentContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <fieldset
        disabled={!isContentEditable}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          minInlineSize: 0,
          display: "grid",
          gap: 20,
          opacity: isContentEditable ? 1 : 0.84,
        }}
      >
      <div>
        {!hasStoryContent ? (
          <div style={{ ...hintStackStyle, marginBottom: 16 }}>
            <div style={operatorHintStyle("muted")}>Add a story to enrich the doll&apos;s identity.</div>
          </div>
        ) : null}

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>Story Engine v2</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => applyTone(storyTone)} style={primaryButton} disabled={storyGenerating}>
                {storyGenerating ? "Generating..." : "Generate with AI"}
              </button>
              <button
                onClick={saveStory}
                style={sectionSaveButtonStyle(storyDirty, storySaving, storyHasSavedSnapshot)}
                disabled={storySaveDisabled}
              >
                {storySaveLabel}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ color: "#475569" }}>Tone</label>

            <select value={storyTone} onChange={(e) => setStoryTone(e.target.value)} style={{ ...inputStyle, width: 180 }}>
              {STORY_TONES.map((tone) => (
                <option key={tone} value={tone}>{tone}</option>
              ))}
            </select>

            <button onClick={() => applyTone("Gentle")} style={secondaryButton} disabled={storyGenerating}>Gentle</button>
            <button onClick={() => applyTone("Playful")} style={secondaryButton} disabled={storyGenerating}>Playful</button>
            <button onClick={() => applyTone("Magical")} style={secondaryButton} disabled={storyGenerating}>Magical</button>
          </div>
        </div>

        {storyVariations && storyVariations.length > 0 ? (
          <div style={storyVariationPanelStyle}>
            <div style={storyVariationPanelHeaderStyle}>
              <div>
                <div style={storyVariationPanelTitleStyle}>Story Variations</div>
                <div style={storyVariationPanelHintStyle}>
                  Choose the version to place in the Main story field. Saving still happens only when you click Save Story.
                </div>
              </div>
            </div>

            <div style={storyVariationGridStyle}>
              {storyVariations.map((variation) => {
                const isSelected = selectedStoryVariationId === variation.id;
                const previewText =
                  variation.story_main.length > 240
                    ? `${variation.story_main.slice(0, 240).trimEnd()}...`
                    : variation.story_main;

                return (
                  <div
                    key={variation.id}
                    className={`admin-variation-card${isSelected ? " is-selected" : ""}`}
                    style={storyVariationCardStyle(isSelected)}
                  >
                    <div style={storyVariationCardHeaderStyle}>
                      <div style={storyVariationCardLabelStyle}>{variation.label}</div>
                      <div style={storyVariationBadgeStyle(isSelected)}>
                        {isSelected ? "Selected" : variation.id.toUpperCase()}
                      </div>
                    </div>

                    <p className="admin-variation-preview" style={storyVariationPreviewStyle}>{previewText}</p>

                    <button
                      onClick={() => applyStoryVariationToEditor(variation)}
                      className="admin-variation-button"
                      style={storyVariationActionStyle(isSelected)}
                      disabled={isSelected}
                    >
                      {isSelected ? "Selected in editor" : "Use this version"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <label style={labelStyle}>Card teaser</label>
          <textarea value={story.teaser} onChange={(e) => setStory({ ...story, teaser: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Main story</label>
          <textarea
            value={story.mainStory}
            onChange={(e) => {
              setSelectedStoryVariationId("");
              setStory({ ...story, mainStory: e.target.value });
            }}
            style={{ ...inputStyle, minHeight: 120 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Mini story 1</label>
            <textarea value={story.mini1} onChange={(e) => setStory({ ...story, mini1: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
          </div>

          <div>
            <label style={labelStyle}>Mini story 2</label>
            <textarea value={story.mini2} onChange={(e) => setStory({ ...story, mini2: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {!hasContentAssets ? (
          <div style={hintStackStyle}>
            <div style={operatorHintStyle("muted")}>
              Add content assets to expand the digital experience.
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 700 }}>Content Pack</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={generateContentPack} style={primaryButton} disabled={contentPackGenerating}>
              {contentPackGenerating ? "Generating..." : "Generate with AI"}
            </button>
            <button
              onClick={saveContentPack}
              style={sectionSaveButtonStyle(
                contentPackDirty,
                contentPackSaving,
                contentPackHasSavedSnapshot
              )}
              disabled={contentPackSaveDisabled}
            >
              {contentPackSaveLabel}
            </button>
          </div>
        </div>

        {contentPackVariations && contentPackVariations.length > 0 ? (
          <div style={storyVariationPanelStyle}>
            <div style={storyVariationPanelHeaderStyle}>
              <div>
                <div style={storyVariationPanelTitleStyle}>Content Pack Variations</div>
                <div style={storyVariationPanelHintStyle}>
                  Choose the version to place in the editable fields. Saving still happens only when you click Save Content Pack.
                </div>
              </div>
            </div>

            <div style={storyVariationGridStyle}>
              {contentPackVariations.map((variation) => {
                const isSelected = selectedContentPackVariationId === variation.id;
                const introPreview =
                  variation.short_intro.length > 140
                    ? `${variation.short_intro.slice(0, 140).trimEnd()}...`
                    : variation.short_intro;
                const blurbPreview =
                  variation.content_blurb.length > 200
                    ? `${variation.content_blurb.slice(0, 200).trimEnd()}...`
                    : variation.content_blurb;

                return (
                  <div
                    key={variation.id}
                    className={`admin-variation-card${isSelected ? " is-selected" : ""}`}
                    style={storyVariationCardStyle(isSelected)}
                  >
                    <div style={storyVariationCardHeaderStyle}>
                      <div style={storyVariationCardLabelStyle}>{variation.label}</div>
                      <div style={storyVariationBadgeStyle(isSelected)}>
                        {isSelected ? "Selected" : variation.id.toUpperCase()}
                      </div>
                    </div>

                    <div style={contentPackVariationPreviewStackStyle}>
                      <div style={contentPackVariationPreviewBlockStyle}>
                        <div style={contentPackVariationPreviewLabelStyle}>Short intro</div>
                        <p className="admin-variation-preview" style={storyVariationPreviewStyle}>{introPreview}</p>
                      </div>

                      <div style={contentPackVariationPreviewBlockStyle}>
                        <div style={contentPackVariationPreviewLabelStyle}>Content blurb</div>
                        <p className="admin-variation-preview" style={storyVariationPreviewStyle}>{blurbPreview}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => applyContentPackVariationToEditor(variation)}
                      className="admin-variation-button"
                      style={storyVariationActionStyle(isSelected)}
                      disabled={isSelected}
                    >
                      {isSelected ? "Selected in editor" : "Use this version"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Instagram Caption</div>
          <textarea
            value={contentPack.caption}
            onChange={(e) => {
              setSelectedContentPackVariationId("");
              setContentPack({ ...contentPack, caption: e.target.value });
            }}
            style={{ ...inputStyle, minHeight: 140 }}
          />
        </div>

        <div style={contentGridStyle}>
          <div style={contentCardStyle}>
            <div style={sectionLabelStyle}>Short Promo Hook</div>
            <textarea
              value={contentPack.hook}
              onChange={(e) => {
                setSelectedContentPackVariationId("");
                setContentPack({ ...contentPack, hook: e.target.value });
              }}
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>

          <div style={contentCardStyle}>
            <div style={sectionLabelStyle}>CTA</div>
            <textarea
              value={contentPack.cta}
              onChange={(e) => {
                setSelectedContentPackVariationId("");
                setContentPack({ ...contentPack, cta: e.target.value });
              }}
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>
        </div>

        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Product Blurb</div>
          <textarea
            value={contentPack.blurb}
            onChange={(e) => {
              setSelectedContentPackVariationId("");
              setContentPack({ ...contentPack, blurb: e.target.value });
            }}
            style={{ ...inputStyle, minHeight: 140 }}
          />
        </div>

        <div style={contentCardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Social Content</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={generateSocialContent}
                style={primaryButton}
                disabled={socialGenerating}
              >
                {socialGenerating ? "Generating..." : "Generate with AI"}
              </button>
              <button
                onClick={saveIdentity}
                style={sectionSaveButtonStyle(socialDirty, socialSaving, socialHasSavedSnapshot)}
                disabled={socialSaveDisabled}
              >
                {socialSaveLabel}
              </button>
            </div>
          </div>

          {socialVariations && socialVariations.length > 0 ? (
            <div style={storyVariationPanelStyle}>
              <div style={storyVariationPanelHeaderStyle}>
                <div>
                  <div style={storyVariationPanelTitleStyle}>Social Variations</div>
                  <div style={storyVariationPanelHintStyle}>
                    Choose the version to place in the editable fields. Saving still happens only when you click Save Social Content.
                  </div>
                </div>
              </div>

              <div style={storyVariationGridStyle}>
                {socialVariations.map((variation) => {
                  const isSelected = selectedSocialVariationId === variation.id;
                  const hookPreview =
                    variation.social_hook.length > 120
                      ? `${variation.social_hook.slice(0, 120).trimEnd()}...`
                      : variation.social_hook;
                  const captionPreview =
                    variation.social_caption.length > 120
                      ? `${variation.social_caption.slice(0, 120).trimEnd()}...`
                      : variation.social_caption;

                  return (
                    <div
                      key={variation.id}
                      className={`admin-variation-card${isSelected ? " is-selected" : ""}`}
                      style={storyVariationCardStyle(isSelected)}
                    >
                      <div style={storyVariationCardHeaderStyle}>
                        <div style={storyVariationCardLabelStyle}>{variation.label}</div>
                        <div style={storyVariationBadgeStyle(isSelected)}>
                          {isSelected ? "Selected" : variation.id.toUpperCase()}
                        </div>
                      </div>

                      <div style={contentPackVariationPreviewStackStyle}>
                        <div style={contentPackVariationPreviewBlockStyle}>
                          <div style={contentPackVariationPreviewLabelStyle}>Hook</div>
                          <p className="admin-variation-preview" style={storyVariationPreviewStyle}>{hookPreview}</p>
                        </div>

                        <div style={contentPackVariationPreviewBlockStyle}>
                          <div style={contentPackVariationPreviewLabelStyle}>Caption preview</div>
                          <p className="admin-variation-preview" style={storyVariationPreviewStyle}>{captionPreview}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => applySocialVariationToEditor(variation)}
                        className="admin-variation-button"
                        style={storyVariationActionStyle(isSelected)}
                        disabled={isSelected}
                      >
                        {isSelected ? "Selected in editor" : "Use this version"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Hook</label>
              <input
                value={identity.social_hook}
                onChange={(e) => {
                  setSelectedSocialVariationId("");
                  setIdentity({ ...identity, social_hook: e.target.value });
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Caption</label>
              <textarea
                value={identity.social_caption}
                onChange={(e) => {
                  setSelectedSocialVariationId("");
                  setIdentity({ ...identity, social_caption: e.target.value });
                }}
                style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={labelStyle}>CTA</label>
              <input
                value={identity.social_cta}
                onChange={(e) => {
                  setSelectedSocialVariationId("");
                  setIdentity({ ...identity, social_cta: e.target.value });
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Social Status</label>
              <select
                value={identity.social_status}
                onChange={(e) => setIdentity({ ...identity, social_status: e.target.value })}
                style={inputStyle}
              >
                <option value="draft">Draft</option>
                <option value="ready_to_post">Ready to Post</option>
                <option value="posted">Posted</option>
              </select>
            </div>

          </div>
        </div>
      </div>
      </fieldset>
    </div>
  );
  const digitalDepartmentContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <div style={digitalCardStyle}>
        <div style={sectionLabelStyle}>Slug</div>
        <div style={slugRowStyle}>
          <code style={slugCodeStyle}>{selectedSlug || "no-slug-yet"}</code>
          <button onClick={() => copyToClipboard(selectedSlug, "Slug copied.")} style={secondaryButton}>
            Copy Slug
          </button>
        </div>
        {dataQualityHints.length ? (
          <div style={{ ...hintStackStyle, marginTop: 12 }}>
            {dataQualityHints.map((hint) => (
              <div key={hint} style={operatorHintStyle("warn")}>
                {hint}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={digitalGridStyle}>
        <div style={digitalCardStyle}>
          <div style={digitalHeaderStyle}>
            <div>
              <div style={sectionLabelStyle}>Digital Identity</div>
              <p style={mutedTextStyle}>
                QR codes are managed here as a system-generated asset tied to this doll&apos;s public page.
              </p>
              <div style={{ ...hintStackStyle, marginTop: 12 }}>
                {digitalHints.map((hint, index) => (
                  <div
                    key={`${hint}-${index}`}
                    style={operatorHintStyle(index === 0 && !hasQrIdentity ? "warn" : "muted")}
                  >
                    {hint}
                  </div>
                ))}
              </div>
            </div>
            <div style={digitalStatusPillStyle(qrIsSensitive)}>{qrSensitivityLabel}</div>
          </div>

          <div style={digitalInfoBoxStyle}>
            <div style={digitalInfoTitleStyle}>Public URL</div>
            <code style={urlCodeStyle}>{publicUrl || publicPath || "/doll/your-doll-slug"}</code>
            <div style={digitalInfoTextStyle}>This link is encoded in the QR code.</div>
            <div style={digitalInfoTextStyle}>{qrSensitivityText}</div>
          </div>

          <div style={qrPlaceholderStyle}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${selected?.name || "doll"}`}
                style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 12 }}
              />
            ) : (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>No QR generated yet</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  Generate a QR code and save it directly to this doll&apos;s digital identity.
                </div>
              </div>
            )}
          </div>

          <div style={qrStatusBoxStyle(qrStatus)}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {qrStatus === "saved"
                ? "QR saved successfully"
                : qrStatus === "generated"
                  ? "QR generated but not saved"
                  : "QR not generated yet"}
            </div>

            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
              {qrStatus === "saved"
                ? "This QR is stored in Supabase and linked to this doll."
                : qrStatus === "generated"
                  ? "A fresh QR preview exists, but it could not be saved yet."
                  : "No QR has been generated for this doll yet."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <button
              onClick={activateDigitalLayer}
              style={isGatewayEditable ? primaryButton : disabledActionStyle(primaryButton)}
              disabled={!isGatewayEditable}
            >
              Prepare Digital Identity
            </button>

            <button
              onClick={savedQrUrl ? requestQrRegeneration : generateQrCode}
              style={
                !isGatewayEditable
                  ? disabledActionStyle(savedQrUrl ? secondaryButton : primaryButton)
                  : savedQrUrl
                    ? secondaryButton
                    : primaryButton
              }
              disabled={!isGatewayEditable || !publicUrl || qrUploading || !qrReady}
            >
              {qrUploading
                ? savedQrUrl
                  ? "Regenerating..."
                  : "Generating..."
                : savedQrUrl
                  ? "Regenerate QR"
                  : "Generate QR"}
            </button>

            <button onClick={() => window.open(publicUrl, "_blank")} style={secondaryButton} disabled={!publicUrl}>
              Open Public Page
            </button>

            <button onClick={() => copyToClipboard(publicUrl, "Public URL copied.")} style={secondaryButton} disabled={!publicUrl}>
              Copy URL
            </button>

            <button onClick={downloadQrCode} style={secondaryButton} disabled={!qrDataUrl}>
              Download QR
            </button>

            <button onClick={downloadPrintCard} style={secondaryButton} disabled={!qrDataUrl}>
              Download Print Card
            </button>
          </div>

          {!qrReady ? (
            <div style={{ ...hintStackStyle, marginTop: 12 }}>
              <div style={operatorHintStyle("warn")}>
                {qrReadinessMessage}
              </div>
            </div>
          ) : null}

          {showQrRegenerateWarning ? (
            <div style={qrWarningBoxStyle}>
              <div style={qrWarningTitleStyle}>Regenerate QR Code?</div>
              <div style={qrWarningTextStyle}>{qrWarningMessage}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
                <button
                  onClick={() => setShowQrRegenerateWarning(false)}
                  style={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmQrRegeneration}
                  style={
                    !isGatewayEditable
                      ? disabledActionStyle(dangerButton)
                      : dangerButton
                  }
                  disabled={!isGatewayEditable || qrUploading}
                >
                  {qrUploading ? "Regenerating..." : "Regenerate anyway"}
                </button>
              </div>
            </div>
          ) : null}

          {qrDataUrl ? (
            <div style={printCardWrapperStyle}>
              <div ref={printCardRef} style={printCardStyle}>
                <div style={printCardNameStyle}>
                  {identity.name || selected?.name || "Doll"}
                </div>

                <div style={printCardTextStyle}>
                  Scan to discover her world ✨
                </div>

                <img
                  src={qrDataUrl}
                  alt={`Print card QR for ${identity.name || selected?.name || "doll"}`}
                  style={printCardQrStyle}
                />

                <div style={printCardBrandStyle}>
                  Maille &amp; Merveille
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div style={digitalCardStyle}>
          <div style={sectionLabelStyle}>Visual Block</div>
          <div style={visualPlaceholderStyle}>
            <div style={{ width: "100%" }}>
              {identity.image_url ? (
                <img
                  src={identity.image_url}
                  alt="Doll"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    objectFit: "cover",
                    maxHeight: 260,
                  }}
                />
              ) : (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>No image yet</div>
                  <div style={{ fontSize: 14, color: "#64748b" }}>
                    Upload a doll image
                  </div>
                </div>
              )}

              {!hasImage ? (
                <div style={{ ...hintStackStyle, marginTop: 12 }}>
                  <div style={operatorHintStyle("muted")}>
                    Add a doll image to complete the public page.
                  </div>
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                style={{ marginTop: 12 }}
                disabled={!isGatewayEditable}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await uploadImage(file);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const commerceDepartmentContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <div style={contentCardStyle}>
        <div style={sectionLabelStyle}>Product Commerce Status</div>
        <div style={{ color: "#64748b", fontSize: 15, marginTop: -2, marginBottom: 14 }}>
          Controls whether this doll is sellable and counts toward Gateway readiness.
        </div>
        <select
          value={commerceStatus}
          onChange={(e) => setCommerceStatus(normalizeCommerceStatus(e.target.value))}
          style={
            isGatewayEditable && !commerceSaving
              ? inputStyle
              : disabledFormControlStyle(inputStyle)
          }
          disabled={!isGatewayEditable || commerceSaving}
        >
          <option value="draft">Draft</option>
          <option value="ready_for_sale">Ready for Sale</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <div style={inlineValidationHintStyle}>
          Product Commerce Status controls sellability. Order Status tracks the customer/order lifecycle.
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            onClick={saveCommerceStatus}
            style={
              isGatewayEditable && !commerceSaving
                ? primaryButton
                : disabledActionStyle(primaryButton)
            }
            disabled={!isGatewayEditable || commerceSaving}
          >
            {commerceSaving ? "Saving..." : "Save Product Commerce Status"}
          </button>
        </div>
      </div>

      <div style={contentCardStyle}>
        <div style={sectionLabelStyle}>Customer Name</div>
        <input
          value={order.customer_name}
          onChange={(e) => setOrder({ ...order, customer_name: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={contentCardStyle}>
        <div style={sectionLabelStyle}>Contact Info</div>
        <input
          value={order.contact_info}
          onChange={(e) => setOrder({ ...order, contact_info: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={contentCardStyle}>
        <div style={sectionLabelStyle}>Order Status</div>
        <select
          value={order.order_status}
          onChange={(e) => setOrder({ ...order, order_status: e.target.value })}
          style={inputStyle}
        >
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
        <div style={inlineValidationHintStyle}>
          Tracks the customer/order lifecycle only. This does not control Gateway readiness.
        </div>
      </div>

      <div style={contentCardStyle}>
        <div style={sectionLabelStyle}>Notes</div>
        <textarea
          value={order.notes}
          onChange={(e) => setOrder({ ...order, notes: e.target.value })}
          style={{ ...inputStyle, minHeight: 120 }}
        />
      </div>

      <button onClick={saveOrder} style={primaryButton}>
        Save Order
      </button>
    </div>
  );
  const dangerZoneDepartmentContent = (
    <div style={dangerZoneStyle}>
      <div style={dangerZoneLabelStyle}>Danger Zone</div>
      <div style={dangerZoneTitleStyle}>Archive or permanently remove this doll</div>
      <p style={dangerZoneTextStyle}>
        Use these actions only when you need to retire a doll from the active lifecycle or remove its
        digital identity completely. Archiving keeps everything intact. Permanent deletion removes the
        doll, its public story data, QR identity, and linked order records.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={requestArchiveDoll}
          style={secondaryButton}
          disabled={dangerLoading === "archive" || dangerLoading === "delete"}
        >
          {dangerLoading === "archive" ? "Archiving..." : "Archive Doll"}
        </button>

        <button
          onClick={requestPermanentDelete}
          style={dangerButton}
          disabled={dangerLoading === "archive" || dangerLoading === "delete"}
        >
          {dangerLoading === "delete" ? "Deleting..." : "Delete Permanently"}
        </button>
      </div>

      {dangerAction === "archive" ? (
        <div style={dangerConfirmCardStyle}>
          <div style={dangerConfirmTitleStyle}>Archive this doll?</div>
          <div style={dangerConfirmTextStyle}>{archiveWarningMessage}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <button
              onClick={() => setDangerAction(null)}
              style={secondaryButton}
              disabled={dangerLoading === "archive"}
            >
              Cancel
            </button>
            <button
              onClick={archiveDoll}
              style={primaryButton}
              disabled={dangerLoading === "archive"}
            >
              {dangerLoading === "archive" ? "Archiving..." : "Archive Doll"}
            </button>
          </div>
        </div>
      ) : null}

      {dangerAction === "delete" ? (
        <div style={dangerConfirmCardStyle}>
          <div style={dangerConfirmTitleStyle}>Delete this doll permanently?</div>
          <div style={dangerConfirmTextStyle}>{deleteWarningMessage}</div>
          <div style={{ ...dangerConfirmTextStyle, marginTop: 10 }}>
            This will remove the doll&apos;s public page content, QR identity, stories, content assets,
            orders, and linked uploaded files.
          </div>

          {dangerNeedsTypedDelete ? (
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Type DELETE to confirm</label>
              <input
                value={dangerConfirmText}
                onChange={(e) => setDangerConfirmText(e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <button
              onClick={() => {
                setDangerAction(null);
                setDangerConfirmText("");
              }}
              style={secondaryButton}
              disabled={dangerLoading === "delete"}
            >
              Cancel
            </button>
            <button
              onClick={deleteDollPermanently}
              style={dangerButton}
              disabled={
                dangerLoading === "delete" ||
                (dangerNeedsTypedDelete && dangerConfirmText !== "DELETE")
              }
            >
              {dangerLoading === "delete" ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
  const overviewSummaryContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Sellability", value: formatStatusToken(effectiveCommerceStatus), tone: "neutral" },
          {
            label: "Access",
            value: formatStatusToken(effectiveAccessStatus),
            tone: effectiveAccessStatus === "generated" ? "success" : "warn",
          },
        ].map((item) => (
          <div key={item.label} style={statusPillStyle(item.tone)}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: 0.75,
                fontWeight: 700,
              }}
            >
              {item.label}
            </div>
            <div style={{ fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={contentCardStyle}>
        <div style={sectionLabelStyle}>Production Readiness</div>
        {productionWorkflowComplete ? (
          <div style={operatorHintStyle("success")}>
            {selectedReadiness.overall
              ? "Production is complete."
              : "Production is complete. Complete all readiness sections before progressing the order."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {overviewBlockingItems.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.label}</div>
                <div style={{ color: "#9a3412", fontSize: 14, textAlign: "right" }}>
                  {readinessMissingLabel(item.state.missing[0])}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  const contentManagementWorkspaceContent = (
    <div style={contentManagementWorkspaceStyle}>
      <div style={contentManagementPanelStyle}>
        <div style={contentManagementPanelHeaderStyle}>
          <div>
            <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>Content Management</div>
            <div style={contentManagementTitleStyle}>Content Overview</div>
          </div>
          <div style={contentManagementPanelMetaStyle}>
            This layer supports content work without changing the production pipeline.
          </div>
        </div>

        <div style={contentManagementOverviewGridStyle}>
          {contentOverviewItems.map((item) => (
            <div
              key={item.key}
              style={contentManagementMetricCardStyle(
                item.tone,
                item.key === "asset_completeness"
              )}
            >
              <div style={contentManagementMetricLabelStyle(item.tone)}>{item.label}</div>
              <div style={contentManagementMetricValueStyle}>{item.value}</div>
              <div style={contentManagementMetricMetaTextStyle}>{item.meta}</div>
              {item.key === "asset_completeness" ? (
                <div style={contentManagementAssetListStyle}>
                  {contentAssetCompleteness.items.map((asset) => (
                    <div
                      key={asset.key}
                      style={contentManagementAssetBadgeStyle(asset.complete)}
                    >
                      {asset.label}: {asset.complete ? "Yes" : "No"}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div style={contentManagementPanelStyle}>
        <div>
          <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>Content Production</div>
          <div style={contentManagementTitleStyle}>Content Actions</div>
        </div>

        <div style={contentManagementActionGridStyle}>
          <button
            onClick={handleGenerateManagedContent}
            style={contentManagementActionButtonStyle("primary", managedContentGenerating)}
            disabled={managedContentGenerating}
          >
            {managedContentGenerating ? "Generating..." : "Generate Content"}
          </button>
          <button
            onClick={handlePreviewManagedContent}
            style={contentManagementActionButtonStyle("secondary", !contentPreviewHref)}
            disabled={!contentPreviewHref}
          >
            Preview
          </button>
          <button
            onClick={handleApproveManagedContent}
            style={contentManagementActionButtonStyle(
              "secondary",
              selectedContentManagement.generation_status !== "generated"
            )}
            disabled={selectedContentManagement.generation_status !== "generated"}
          >
            Approve
          </button>
          <button
            onClick={handlePublishManagedContent}
            style={contentManagementActionButtonStyle(
              "primary",
              selectedContentManagement.review_status !== "approved"
            )}
            disabled={selectedContentManagement.review_status !== "approved"}
          >
            Publish
          </button>
          <button
            onClick={handleUnpublishManagedContent}
            style={contentManagementActionButtonStyle(
              "secondary",
              selectedContentManagement.publish_status !== "live"
            )}
            disabled={selectedContentManagement.publish_status !== "live"}
          >
            Unpublish
          </button>
        </div>

        {contentManagementNextStepGuidance ? (
          <div style={contentManagementGuidanceStyle}>
            <div style={contentManagementGuidanceLabelStyle}>Next Step</div>
            <div style={contentManagementGuidanceTextStyle}>
              {contentManagementNextStepGuidance}
            </div>
          </div>
        ) : null}

        <div style={operatorHintStyle("muted")}>
          Generated content can be reviewed and edited here without changing pipeline stage
          state, QR behavior, commerce status, or CRM/order flow.
        </div>
      </div>
    </div>
  );
  const contentStudioGeneratedDraftContent = (
    <div style={contentStudioDraftSectionStyle}>
      <div style={contentStudioDraftHeaderStyle}>
        <div>
          <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>Generated V1 Content</div>
          <div style={contentManagementTitleStyle}>Controlled Editing</div>
        </div>
        <div style={contentManagementPanelMetaStyle}>
          Operators can edit generated copy here. Save writes back to the same Supabase
          fields on this doll.
        </div>
      </div>

      <div style={contentStudioDraftGridStyle}>
        <div style={contentCardStyle}>
          <div style={contentStudioSectionHeaderStyle}>
            <label style={labelStyle}>Intro Script</label>
            <div style={contentStudioSectionActionsStyle}>
              {generatedContentEditState.intro_script ? (
                <>
                  <button
                    onClick={saveIntroScriptEdit}
                    style={contentStudioSectionButtonStyle(
                      "primary",
                      generatedContentSavingState.intro_script
                    )}
                    disabled={generatedContentSavingState.intro_script}
                  >
                    {generatedContentSavingState.intro_script ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelIntroScriptEditing}
                    style={contentStudioSectionButtonStyle(
                      "secondary",
                      generatedContentSavingState.intro_script
                    )}
                    disabled={generatedContentSavingState.intro_script}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={startIntroScriptEditing}
                  style={contentStudioSectionButtonStyle("secondary")}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <textarea
            value={
              generatedContentEditState.intro_script
                ? introScriptDraft
                : selectedGeneratedV1Content.intro_script
            }
            onChange={(event) => setIntroScriptDraft(event.target.value)}
            readOnly={!generatedContentEditState.intro_script}
            placeholder="Generate content to create the intro script."
            style={
              generatedContentEditState.intro_script
                ? { ...inputStyle, minHeight: 120 }
                : { ...contentStudioReadonlyFieldStyle, minHeight: 120 }
            }
          />
        </div>

        <div style={contentStudioStoryGridStyle}>
          {selectedGeneratedV1Content.story_pages.map((page, index) => (
            <div key={`story-page-${index + 1}`} style={contentCardStyle}>
              <div style={contentStudioSectionHeaderStyle}>
                <label style={labelStyle}>Story Page {index + 1}</label>
                <div style={contentStudioSectionActionsStyle}>
                  {generatedContentEditState.story_pages[index] ? (
                    <>
                      <button
                        onClick={() => saveStoryPageEdit(index)}
                        style={contentStudioSectionButtonStyle(
                          "primary",
                          generatedContentSavingState.story_pages[index]
                        )}
                        disabled={generatedContentSavingState.story_pages[index]}
                      >
                        {generatedContentSavingState.story_pages[index] ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => cancelStoryPageEditing(index)}
                        style={contentStudioSectionButtonStyle(
                          "secondary",
                          generatedContentSavingState.story_pages[index]
                        )}
                        disabled={generatedContentSavingState.story_pages[index]}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startStoryPageEditing(index)}
                      style={contentStudioSectionButtonStyle("secondary")}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={generatedContentEditState.story_pages[index] ? storyPageDrafts[index] : page}
                onChange={(event) =>
                  setStoryPageDrafts((prev) =>
                    prev.map((value, pageIndex) =>
                      pageIndex === index ? event.target.value : value
                    )
                  )
                }
                readOnly={!generatedContentEditState.story_pages[index]}
                placeholder={`Generate content to create story page ${index + 1}.`}
                style={
                  generatedContentEditState.story_pages[index]
                    ? { ...inputStyle, minHeight: 120 }
                    : { ...contentStudioReadonlyFieldStyle, minHeight: 120 }
                }
              />
            </div>
          ))}
        </div>

        <div style={contentCardStyle}>
          <div style={contentStudioSectionHeaderStyle}>
            <label style={labelStyle}>Play Activity</label>
            <div style={contentStudioSectionActionsStyle}>
              {generatedContentEditState.play_activity ? (
                <>
                  <button
                    onClick={savePlayActivityEdit}
                    style={contentStudioSectionButtonStyle(
                      "primary",
                      generatedContentSavingState.play_activity
                    )}
                    disabled={generatedContentSavingState.play_activity}
                  >
                    {generatedContentSavingState.play_activity ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelPlayActivityEditing}
                    style={contentStudioSectionButtonStyle(
                      "secondary",
                      generatedContentSavingState.play_activity
                    )}
                    disabled={generatedContentSavingState.play_activity}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={startPlayActivityEditing}
                  style={contentStudioSectionButtonStyle("secondary")}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div style={contentStudioFieldStackStyle}>
            <div>
              <label style={labelStyle}>Prompt</label>
              <input
                value={
                  generatedContentEditState.play_activity
                    ? playActivityDraft.prompt
                    : selectedGeneratedV1Content.play_activity.prompt
                }
                onChange={(event) =>
                  setPlayActivityDraft((prev) => ({
                    ...prev,
                    prompt: event.target.value,
                  }))
                }
                readOnly={!generatedContentEditState.play_activity}
                placeholder="Generate content to create the play activity."
                style={
                  generatedContentEditState.play_activity
                    ? inputStyle
                    : contentStudioReadonlyFieldStyle
                }
              />
            </div>

            {generatedContentEditState.play_activity ? (
              <div style={contentStudioChoiceListStyle}>
                {buildEditablePlayActivityState(playActivityDraft).choices.map((choice, index) => (
                  <div key={choice.id} style={contentStudioChoiceEditorCardStyle}>
                    <div>
                      <label style={labelStyle}>Choice {index + 1} Label</label>
                      <input
                        value={choice.label}
                        onChange={(event) =>
                          setPlayActivityDraft((prev) => ({
                            ...prev,
                            choices: buildEditablePlayActivityState(prev).choices.map(
                              (draftChoice, choiceIndex) =>
                                choiceIndex === index
                                  ? {
                                      ...draftChoice,
                                      label: event.target.value,
                                    }
                                  : draftChoice
                            ),
                          }))
                        }
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Choice {index + 1} Result</label>
                      <textarea
                        value={choice.result_text}
                        onChange={(event) =>
                          setPlayActivityDraft((prev) => ({
                            ...prev,
                            choices: buildEditablePlayActivityState(prev).choices.map(
                              (draftChoice, choiceIndex) =>
                                choiceIndex === index
                                  ? {
                                      ...draftChoice,
                                      result_text: event.target.value,
                                    }
                                  : draftChoice
                            ),
                          }))
                        }
                        style={{ ...inputStyle, minHeight: 100 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedHasPlayActivityChoices ? (
              <div style={contentStudioChoiceListStyle}>
                {selectedEditablePlayActivity.choices.map((choice, index) => (
                  <div key={choice.id} style={contentStudioChoiceCardStyle}>
                    <div style={contentStudioChoiceLabelStyle}>
                      Choice {index + 1}: {choice.label || "Untitled"}
                    </div>
                    <div style={contentStudioChoiceResultStyle}>{choice.result_text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={inlineValidationHintStyle}>
                Generate content to create the play activity choices.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  const sharedWorkspaceFeedbackContent = workflowFeedback ? (
    <div style={workflowFeedbackSlotStyle}>
      <div
        aria-live="polite"
        role={workflowFeedback.tone === "error" ? "alert" : "status"}
        title={workflowFeedback.message}
        style={workflowFeedbackMessageStyle(workflowFeedback.tone, true)}
      >
        {workflowFeedback.message}
      </div>
    </div>
  ) : null;
  const dashboardWorkspaceContent = (
    <div style={dashboardWorkspaceStyle}>
      {sharedWorkspaceFeedbackContent}

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
          onClick={() => setSelectedWorkspaceMode("pipeline")}
          style={dashboardActionCardStyle(dashboardRecommendedWorkspace === "pipeline")}
        >
          <div style={dashboardActionLabelStyle}>Workspace</div>
          <div style={dashboardActionTitleStyle}>Open Production Pipeline</div>
          <div style={dashboardActionDescriptionStyle}>
            Manage pipeline progression, readiness, digital activation, commerce,
            and downstream order work for this doll.
          </div>
          {dashboardRecommendedWorkspace === "pipeline" ? (
            <div style={dashboardActionBadgeStyle}>Recommended</div>
          ) : null}
        </button>

        <button
          onClick={() => setSelectedWorkspaceMode("content_studio")}
          style={dashboardActionCardStyle(dashboardRecommendedWorkspace === "content_studio")}
        >
          <div style={dashboardActionLabelStyle}>Workspace</div>
          <div style={dashboardActionTitleStyle}>Open Content Studio</div>
          <div style={dashboardActionDescriptionStyle}>
            Manage content overview, approval, publishing status, and the Build 1
            content operations for this doll.
          </div>
          {dashboardRecommendedWorkspace === "content_studio" ? (
            <div style={dashboardActionBadgeStyle}>Recommended</div>
          ) : null}
        </button>
      </div>
    </div>
  );
  const overviewWorkspaceContent = (
    <>
      {overviewSummaryContent}
      {dangerZoneDepartmentContent}
    </>
  );
  const contentPipelineBoundaryContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <div style={contentManagementPanelStyle}>
        <div>
          <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>Pipeline Boundary</div>
          <div style={contentManagementTitleStyle}>Content Work Lives in Content Studio</div>
        </div>

        <div style={contentManagementPanelMetaStyle}>
          Use Content Studio for story, content pack, social, and generated experience
          content work for this doll.
        </div>

        <div style={operatorHintStyle("muted")}>
          The Production Pipeline remains the control surface for stage progression.
          Return here when the content work is ready to review or progress.
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setSelectedWorkspaceMode("content_studio")}
            style={primaryButton}
          >
            Open Content Studio
          </button>
        </div>
      </div>
    </div>
  );
  const readyStageContent = (
    <>
      {overviewSummaryContent}
    </>
  );
  const visibleStageContent =
    currentStageView === "overview"
      ? overviewWorkspaceContent
      : currentStageView === "registered"
      ? productionDepartmentContent
      : currentStageView === "character"
        ? characterDepartmentContent
        : currentStageView === "content"
          ? contentPipelineBoundaryContent
          : currentStageView === "gateway"
            ? (
                <>
                  {digitalDepartmentContent}
                  {commerceDepartmentContent}
                </>
              )
            : currentStageView === "ready"
              ? readyStageContent
              : null;
  const pipelineWorkspaceContent = (
    <>
      <div style={workflowHeaderStackStyle}>
        <div style={workflowHeaderPanelStyle}>
          {workflowFeedback ? (
            <div style={workflowFeedbackSlotStyle}>
              <div
                aria-live="polite"
                role={workflowFeedback.tone === "error" ? "alert" : "status"}
                title={workflowFeedback.message}
                style={workflowFeedbackMessageStyle(workflowFeedback.tone, true)}
              >
                {workflowFeedback.message}
              </div>
            </div>
          ) : null}

          <div style={pipelineStageSectionStyle}>
            <div style={workflowSectionHeaderStyle}>
              <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Pipeline</div>
              <button
                onClick={() => setActiveStageView("overview")}
                style={overviewViewButtonStyle(currentStageView === "overview")}
              >
                Overview
              </button>
            </div>
            <div className="pipeline-stage-grid" style={pipelineStageGridStyle}>
              {PRODUCTION_STAGES.map((stage) => {
                const stageStatus = selectedPipelineState?.[stage.key]?.status || "locked";
                const isCurrentOpenStage = stage.key === currentOpenPipelineStage;
                const isCompletedStage = stageStatus === "completed";
                const isActiveStageView = currentStageView === stage.key;

                return (
                  <div
                    key={stage.value}
                    onClick={() => setActiveStageView(stage.key)}
                    style={pipelineStageCardStyle(stageStatus, isActiveStageView)}
                  >
                    <div style={pipelineStageCardHeaderStyle}>
                      <div style={pipelineStageNumberStyle(stageStatus)}>
                        Step {stage.value}
                      </div>
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
                          onClick={() => completePipelineStage(stage.key)}
                          style={pipelineStageActionButtonStyle(
                            stageStatus,
                            pipelineStageActionBusy
                          )}
                          disabled={pipelineStageActionBusy}
                        >
                          {pipelineStageCompleting === stage.key
                            ? "Completing..."
                            : "Complete"}
                        </button>
                      </div>
                    ) : isCompletedStage ? (
                      <div style={pipelineStageActionRowStyle}>
                        <button
                          onClick={() => requestReopenPipelineStage(stage.key)}
                          style={pipelineStageSecondaryActionButtonStyle(
                            stageStatus,
                            pipelineStageActionBusy
                          )}
                          disabled={pipelineStageActionBusy}
                        >
                          {pipelineStageReopening === stage.key
                            ? "Reopening..."
                            : "Reopen"}
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
                  onClick={() => setActiveDepartment(department)}
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
  const contentStudioWorkspaceContent = (
    <div style={contentStudioWorkspaceStackStyle}>
      {sharedWorkspaceFeedbackContent}
      {contentManagementWorkspaceContent}
      {contentDepartmentContent}
      {contentStudioGeneratedDraftContent}
    </div>
  );
  const selectedWorkspaceContent =
    currentSelectedWorkspaceMode === "pipeline"
      ? pipelineWorkspaceContent
      : currentSelectedWorkspaceMode === "content_studio"
        ? contentStudioWorkspaceContent
        : dashboardWorkspaceContent;
  const showPassiveOperationsResults =
    operationsFilter === "live" || operationsFilter === "archived";
  const showProductionQueue =
    !showPassiveOperationsResults &&
    ["all", "needs_attention", "production"].includes(operationsFilter);
  const showContentQueue =
    !showPassiveOperationsResults &&
    ["all", "needs_attention", "content"].includes(operationsFilter);
  const passiveOperationsTitle =
    operationsFilter === "archived" ? "Archived Dolls" : "Live Dolls";
  const passiveOperationsMeta =
    operationsFilter === "archived"
      ? "A read-only reference list for dolls that have been archived out of active operations."
      : "A read-only reference list for dolls whose content is already live.";

  function renderOperationsCard(operation) {
    return (
      <div
        key={operation.id || `${operation.internal_id}-${operation.name}`}
        style={operationsCardStyle(operation.urgency, selected?.id === operation.id)}
      >
        <div style={operationsCardHeaderStyle}>
          <div>
            <div style={operationsCardNameStyle}>{operation.name}</div>
            <div style={operationsCardMetaStyle}>
              {operation.internal_id || "No ID"} - {operation.theme_name || "Unassigned"}
            </div>
          </div>
          <div style={operationsUrgencyBadgeStyle(operation.urgency)}>
            {formatStatusToken(operation.urgency)}
          </div>
        </div>

        <div style={operationsBadgeRowStyle}>
          <div style={operationsBucketBadgeStyle("production")}>
            {formatStatusToken(operation.production_bucket)}
          </div>
          <div style={operationsBucketBadgeStyle("content")}>
            {formatStatusToken(operation.content_bucket)}
          </div>
        </div>

        <div style={operationsActionLabelStyle}>Next Action</div>
        <div style={operationsActionTextStyle}>{operation.next_action}</div>
        <div style={operationsReasonTextStyle}>
          {operation.recommended_workspace_reason}
        </div>

        <div style={operationsCardActionRowStyle}>
          <button
            type="button"
            onClick={() =>
              openDollWorkspace(operation.id, operation.recommended_workspace)
            }
            style={primaryButton}
          >
            {operationsWorkspaceButtonLabel(operation.recommended_workspace)}
          </button>
        </div>
      </div>
    );
  }
  const operationsBoardContent = (
    <section style={operationsBoardStyle}>
      <div style={operationsBoardHeaderStyle}>
        <div>
          <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>Multi-Doll Operations</div>
          <div style={contentManagementTitleStyle}>Operations Board</div>
        </div>
        <div style={operationsBoardMetaStyle}>
          A triage and routing layer that highlights dolls needing attention and routes
          the operator into the correct workspace.
        </div>
      </div>

      <div style={operationsControlsRowStyle}>
        <div style={operationsFilterPillRowStyle}>
          {OPERATIONS_BOARD_FILTERS.map((filterOption) => (
            <button
              key={filterOption.value}
              type="button"
              onClick={() => setOperationsFilter(filterOption.value)}
              style={operationsFilterPillStyle(
                operationsFilter === filterOption.value
              )}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        <div style={operationsSortControlStyle}>
          <label style={labelStyle}>Sort</label>
          <select
            value={operationsSort}
            onChange={(event) => setOperationsSort(event.target.value)}
            style={{ ...inputStyle, minWidth: 180, marginTop: 0 }}
          >
            {OPERATIONS_BOARD_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={operationsSummaryGridStyle}>
        {operationsSummaryItems.map((item) => (
          <div key={item.key} style={operationsSummaryCardStyle}>
            <div style={operationsSummaryLabelStyle}>{item.label}</div>
            <div style={operationsSummaryValueStyle}>{item.value}</div>
          </div>
        ))}
      </div>

      {showPassiveOperationsResults ? (
        <div style={operationsQueueColumnStyle}>
          <div style={operationsQueueHeaderStyle}>
            <div style={contentManagementTitleStyle}>{passiveOperationsTitle}</div>
            <div style={operationsQueueMetaStyle}>{passiveOperationsMeta}</div>
          </div>

          {filteredOperationsByDoll.length ? (
            <div style={operationsCardListStyle}>
              {filteredOperationsByDoll.map((operation) =>
                renderOperationsCard(operation)
              )}
            </div>
          ) : (
            <div style={operationsEmptyStateStyle}>
              {operationsPassiveEmptyStateText(operationsFilter)}
            </div>
          )}
        </div>
      ) : (
        <div style={operationsQueueGridStyle}>
          {showProductionQueue ? (
            <div style={operationsQueueColumnStyle}>
          <div style={operationsQueueHeaderStyle}>
            <div style={contentManagementTitleStyle}>Production Queue</div>
            <div style={operationsQueueMetaStyle}>
              Dolls whose next action belongs in Production Pipeline.
            </div>
          </div>

          {productionQueueGroups.length ? (
            productionQueueGroups.map((group) => (
              <div key={group.bucket} style={operationsBucketSectionStyle}>
                <div style={operationsBucketHeaderStyle}>
                  <div style={operationsBucketTitleStyle}>
                    {formatStatusToken(group.bucket)}
                  </div>
                  <div style={operationsBucketCountStyle}>{group.items.length}</div>
                </div>

                <div style={operationsCardListStyle}>
                  {group.items.map((operation) => (
                    <div
                      key={operation.id}
                      style={operationsCardStyle(
                        operation.urgency,
                        selected?.id === operation.id
                      )}
                    >
                      <div style={operationsCardHeaderStyle}>
                        <div>
                          <div style={operationsCardNameStyle}>{operation.name}</div>
                          <div style={operationsCardMetaStyle}>
                            {operation.internal_id || "No ID"} -{" "}
                            {operation.theme_name || "Unassigned"}
                          </div>
                        </div>
                        <div style={operationsUrgencyBadgeStyle(operation.urgency)}>
                          {formatStatusToken(operation.urgency)}
                        </div>
                      </div>

                      <div style={operationsBadgeRowStyle}>
                        <div style={operationsBucketBadgeStyle("production")}>
                          {formatStatusToken(operation.production_bucket)}
                        </div>
                        <div style={operationsBucketBadgeStyle("content")}>
                          {formatStatusToken(operation.content_bucket)}
                        </div>
                      </div>

                      <div style={operationsActionLabelStyle}>Next Action</div>
                      <div style={operationsActionTextStyle}>{operation.next_action}</div>
                      <div style={operationsReasonTextStyle}>
                        {operation.recommended_workspace_reason}
                      </div>

                      <div style={operationsCardActionRowStyle}>
                        <button
                          onClick={() =>
                            openDollWorkspace(
                              operation.id,
                              operation.recommended_workspace
                            )
                          }
                          style={primaryButton}
                        >
                          {operationsWorkspaceButtonLabel(
                            operation.recommended_workspace
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={operationsEmptyStateStyle}>
              {operationsQueueEmptyStateText("production", operationsFilter)}
            </div>
          )}
            </div>
          ) : null}

          {showContentQueue ? (
            <div style={operationsQueueColumnStyle}>
              <div style={operationsQueueHeaderStyle}>
                <div style={contentManagementTitleStyle}>Content Queue</div>
                <div style={operationsQueueMetaStyle}>
                  Dolls whose next action belongs in Content Studio.
                </div>
              </div>

          {contentQueueGroups.length ? (
            contentQueueGroups.map((group) => (
              <div key={group.bucket} style={operationsBucketSectionStyle}>
                <div style={operationsBucketHeaderStyle}>
                  <div style={operationsBucketTitleStyle}>
                    {formatStatusToken(group.bucket)}
                  </div>
                  <div style={operationsBucketCountStyle}>{group.items.length}</div>
                </div>

                <div style={operationsCardListStyle}>
                  {group.items.map((operation) => (
                    <div
                      key={operation.id}
                      style={operationsCardStyle(
                        operation.urgency,
                        selected?.id === operation.id
                      )}
                    >
                      <div style={operationsCardHeaderStyle}>
                        <div>
                          <div style={operationsCardNameStyle}>{operation.name}</div>
                          <div style={operationsCardMetaStyle}>
                            {operation.internal_id || "No ID"} -{" "}
                            {operation.theme_name || "Unassigned"}
                          </div>
                        </div>
                        <div style={operationsUrgencyBadgeStyle(operation.urgency)}>
                          {formatStatusToken(operation.urgency)}
                        </div>
                      </div>

                      <div style={operationsBadgeRowStyle}>
                        <div style={operationsBucketBadgeStyle("production")}>
                          {formatStatusToken(operation.production_bucket)}
                        </div>
                        <div style={operationsBucketBadgeStyle("content")}>
                          {formatStatusToken(operation.content_bucket)}
                        </div>
                      </div>

                      <div style={operationsActionLabelStyle}>Next Action</div>
                      <div style={operationsActionTextStyle}>{operation.next_action}</div>
                      <div style={operationsReasonTextStyle}>
                        {operation.recommended_workspace_reason}
                      </div>

                      <div style={operationsCardActionRowStyle}>
                        <button
                          onClick={() =>
                            openDollWorkspace(
                              operation.id,
                              operation.recommended_workspace
                            )
                          }
                          style={primaryButton}
                        >
                          {operationsWorkspaceButtonLabel(
                            operation.recommended_workspace
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={operationsEmptyStateStyle}>
              {operationsQueueEmptyStateText("content", operationsFilter)}
            </div>
          )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );

  return (
    <main style={{ background: "#f6f7fb", minHeight: "100vh", padding: 32, fontFamily: "Inter, Arial, sans-serif", color: "#0f172a" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ letterSpacing: 3, fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              MAILLE & MERVEILLE
            </div>

            <h1 style={{ fontSize: 50, margin: 0, lineHeight: 1.05 }}>
              Doll Lifecycle System
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href="/settings"
              style={{ ...secondaryButton, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Settings
            </Link>
            {adminProtectionEnabled ? (
              <button onClick={handleLogout} style={secondaryButton}>
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <p style={{ fontSize: 18, color: "#475569", maxWidth: 860, marginTop: 12 }}>
          A full internal pipeline that transforms every handmade doll into a character, a living digital story asset, and a scalable brand node.
        </p>

        {operationsBoardContent}

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 24, marginTop: 28 }}>
          <section
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22 }}
            data-selected-readiness={selectedReadiness.overall ? "ready" : "incomplete"}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: 24 }}>Doll Navigator</h2>
                <div style={{ color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
                  Selection only. Choose a doll to open its dashboard, production pipeline,
                  or content studio workspace.
                </div>
              </div>

              <button onClick={() => { loadThemes(); loadDolls(); }} style={secondaryButton}>
                Refresh List
              </button>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 22, paddingTop: 18 }}>
              <div style={{ color: "#64748b", marginBottom: 14 }}>Dolls</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {dolls.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      pendingSelectedWorkspaceModeRef.current = "";
                      setSelectedId(d.id);
                    }}
                    style={{
                      textAlign: "left",
                      border: selected?.id === d.id ? "2px solid #0f172a" : "1px solid #cbd5e1",
                      background: d.status === "archived" ? "#f8fafc" : "#fff",
                      opacity: d.status === "archived" ? 0.82 : 1,
                      borderRadius: 20,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{d.name}</div>
                        <div style={{ color: "#64748b", marginTop: 4 }}>
                          {d.internal_id} · {d.theme_name || "Unassigned"}
                        </div>
                      </div>

                      <div style={{ background: "#eef2ff", color: "#0f172a", borderRadius: 999, padding: "6px 12px", fontSize: 14 }}>
                        {statusLabel(d.status)}
                      </div>
                    </div>

                    <div style={{ ...pipelineProgressTrackStyle, marginTop: 14 }}>
                      <div
                        style={{
                          ...pipelineProgressFillStyle,
                          width: `${getPipelineProgressPercent(d)}%`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <footer style={versionFooterStyle}>{adminVersion.label}</footer>
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22 }}>
            {selected ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 28 }}>{selected.name}</h2>
                      {selectedIsArchived ? <div style={archivedBadgeStyle}>Archived</div> : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      <div style={selectedWorkspaceModeBadgeStyle(currentSelectedWorkspaceMode)}>
                        {selectedWorkspaceHeading}
                      </div>
                      <div style={selectedWorkspaceSummaryStyle}>{selectedWorkspaceSummary}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {currentSelectedWorkspaceMode === "content_studio" ? (
                      <button
                        onClick={generateDraft}
                        style={
                          managedContentGenerating
                            ? disabledActionStyle(secondaryButton)
                            : secondaryButton
                        }
                        disabled={managedContentGenerating}
                      >
                        {managedContentGenerating ? "Generating..." : "Generate Content Draft"}
                      </button>
                    ) : null}
                    {currentSelectedWorkspaceMode !== "dashboard" ? (
                      <button
                        onClick={() => setSelectedWorkspaceMode("dashboard")}
                        style={secondaryButton}
                      >
                        Back to Dashboard
                      </button>
                    ) : null}
                  </div>
                </div>
                {selectedWorkspaceContent}
              </>
            ) : (
              <>
                {workflowFeedback ? (
                  <div style={workflowFeedbackSlotStyle}>
                    <div
                      aria-live="polite"
                      role={workflowFeedback.tone === "error" ? "alert" : "status"}
                      title={workflowFeedback.message}
                      style={workflowFeedbackMessageStyle(workflowFeedback.tone, true)}
                    >
                      {workflowFeedback.message}
                    </div>
                  </div>
                ) : null}
                <div style={{ color: "#64748b" }}>Create your first doll to begin.</div>
              </>
            )}
          </section>
        </div>
        <ActionWarningModal
          open={Boolean(stageActionWarning)}
          title={
            stageActionWarning?.type === "reopen" && stageActionWarning?.stage
              ? `Reopen ${PIPELINE_STAGE_LABELS[stageActionWarning.stage]}?`
              : ""
          }
          cancelLabel="Cancel"
          confirmLabel="Confirm Reopen"
          onCancel={() => setStageActionWarning(null)}
          onConfirm={confirmStageActionWarning}
        >
          <div style={actionWarningTextStyle}>
            This will make this stage editable again and lock all downstream stages.
          </div>
          <div style={{ ...actionWarningTextStyle, marginTop: 10 }}>
            No data will be lost, but downstream progress will need to be revalidated.
          </div>
          {stageActionWarning?.type === "reopen" && stageActionWarning.affectedStages?.length ? (
            <div style={actionWarningListStyle}>
              This will lock:{" "}
              {stageActionWarning.affectedStages
                .map((stage) => PIPELINE_STAGE_LABELS[stage] || formatStatusToken(stage))
                .join(", ")}
            </div>
          ) : null}
        </ActionWarningModal>
      </div>
      <style jsx>{`
        .doll-identity-card:hover {
          box-shadow: none !important;
        }

        .admin-variation-card {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease,
            background-color 160ms ease;
        }

        .admin-variation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .admin-variation-card.is-selected {
          box-shadow: 0 16px 30px rgba(34, 197, 94, 0.12);
        }

        .admin-variation-card.is-selected:hover {
          transform: translateY(-1px);
        }

        .admin-variation-button {
          transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease,
            color 140ms ease;
        }

        .admin-variation-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
        }

        .admin-variation-button:focus-visible {
          outline: 2px solid #166534;
          outline-offset: 2px;
        }

        .admin-variation-preview {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 5;
          overflow: hidden;
          white-space: normal !important;
        }

        .pipeline-stage-grid {
          width: 100%;
        }

        @media (max-width: 900px) {
          .doll-identity-meta-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          .doll-identity-meta-strip {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 1180px) {
          .pipeline-stage-grid {
            grid-template-columns: repeat(auto-fit, minmax(148px, 1fr)) !important;
          }
        }

        @media (max-width: 840px) {
          .pipeline-stage-grid {
            grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)) !important;
          }
        }
      `}</style>
    </main>
  );
}

function ActionWarningModal({
  open,
  title,
  children,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div style={actionWarningOverlayStyle} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-warning-title"
        style={actionWarningModalStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div id="action-warning-title" style={actionWarningTitleStyle}>
          {title}
        </div>
        {children}
        <div style={actionWarningActionsStyle}>
          <button onClick={onCancel} style={secondaryButton}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={primaryButton}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 14,
  color: "#475569",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const primaryButton = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const secondaryButton = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const storyVariationPanelStyle = {
  marginBottom: 20,
  display: "grid",
  gap: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 18,
};

const storyVariationPanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  paddingBottom: 2,
};

const storyVariationPanelTitleStyle = {
  fontSize: 17,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
  letterSpacing: "-0.01em",
};

const storyVariationPanelHintStyle = {
  fontSize: 14,
  lineHeight: 1.6,
  color: "#64748b",
  maxWidth: 720,
};

const storyVariationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

function storyVariationCardStyle(isSelected = false) {
  return {
    background: isSelected ? "#f0fdf4" : "#ffffff",
    border: `1px solid ${isSelected ? "#22c55e" : "#dbe3ee"}`,
    borderRadius: 22,
    padding: 20,
    display: "grid",
    gap: 16,
    alignContent: "start",
    minWidth: 0,
    boxShadow: isSelected ? "0 12px 26px rgba(34, 197, 94, 0.12)" : "0 6px 16px rgba(15, 23, 42, 0.04)",
  };
}

const storyVariationCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const storyVariationCardLabelStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.4,
};

function storyVariationBadgeStyle(isSelected = false) {
  return {
    padding: "6px 11px",
    borderRadius: 999,
    background: isSelected ? "#dcfce7" : "#f8fafc",
    border: `1px solid ${isSelected ? "#4ade80" : "#dbe3ee"}`,
    color: isSelected ? "#166534" : "#64748b",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
}

const storyVariationPreviewStyle = {
  margin: 0,
  color: "#334155",
  lineHeight: 1.7,
  fontSize: 14,
  whiteSpace: "pre-wrap",
};

const contentPackVariationPreviewStackStyle = {
  display: "grid",
  gap: 14,
};

const contentPackVariationPreviewBlockStyle = {
  display: "grid",
  gap: 6,
  alignContent: "start",
};

const contentPackVariationPreviewLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

function storyVariationActionStyle(isSelected = false) {
  if (isSelected) {
    return {
      ...secondaryButton,
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
      cursor: "default",
      width: "100%",
      fontWeight: 700,
    };
  }

  return {
    ...secondaryButton,
    width: "100%",
    background: "#eef2f7",
    fontWeight: 700,
  };
}

function sectionSaveButtonLabel(defaultLabel, isDirty, isSaving, hasSavedSnapshot) {
  if (isSaving) return "Saving...";
  if (!isDirty && hasSavedSnapshot) return "Saved";
  return defaultLabel;
}

function sectionSaveButtonStyle(isDirty, isSaving, hasSavedSnapshot) {
  if (isSaving) {
    return {
      ...primaryButton,
      background: "#15803d",
      opacity: 0.85,
      cursor: "progress",
    };
  }

  if (!isDirty && hasSavedSnapshot) {
    return {
      ...secondaryButton,
      background: "#dcfce7",
      color: "#166534",
      opacity: 0.65,
      cursor: "not-allowed",
    };
  }

  return {
    ...primaryButton,
    background: "#166534",
  };
}

function autoResizeTextarea(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

const dangerButton = {
  background: "#991b1b",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const digitalCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

const digitalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

function digitalStatusPillStyle(isSensitive) {
  return {
    display: "inline-flex",
    alignItems: "center",
    background: isSensitive ? "#fff7ed" : "#ecfdf5",
    border: `1px solid ${isSensitive ? "#fdba74" : "#86efac"}`,
    color: isSensitive ? "#9a3412" : "#166534",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
  };
}

const digitalInfoBoxStyle = {
  display: "grid",
  gap: 10,
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 18,
  padding: 16,
  marginBottom: 14,
};

const digitalInfoTitleStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#64748b",
  fontWeight: 700,
};

const digitalInfoTextStyle = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
};

const slugRowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const slugCodeStyle = {
  display: "inline-block",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
};

const urlCodeStyle = {
  display: "block",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  overflowWrap: "anywhere",
};

const digitalGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const qrPlaceholderStyle = {
  margin: "14px 0 18px",
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "#f8fafc",
  padding: 20,
};

function qrStatusBoxStyle(status) {
  if (status === "saved") {
    return {
      background: "#ecfdf5",
      border: "1px solid #86efac",
      borderRadius: 16,
      padding: 16,
      marginTop: 4,
    };
  }

  if (status === "generated") {
    return {
      background: "#fff7ed",
      border: "1px solid #fdba74",
      borderRadius: 16,
      padding: 16,
      marginTop: 4,
    };
  }

  return {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  };
}

const qrWarningBoxStyle = {
  background: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: 18,
  padding: 16,
  marginTop: 14,
};

const qrWarningTitleStyle = {
  fontWeight: 700,
  color: "#9a3412",
  marginBottom: 8,
};

const qrWarningTextStyle = {
  color: "#7c2d12",
  lineHeight: 1.7,
  fontSize: 14,
};

const dangerZoneStyle = {
  marginTop: 28,
  padding: 20,
  border: "1px solid #fecaca",
  background: "#fff7f7",
  borderRadius: 22,
};

const dangerZoneLabelStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#b91c1c",
  marginBottom: 10,
  fontWeight: 700,
};

const dangerZoneTitleStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: "#7f1d1d",
  marginBottom: 8,
};

const dangerZoneTextStyle = {
  color: "#7f1d1d",
  lineHeight: 1.7,
  margin: "0 0 16px",
  fontSize: 15,
};

const dangerConfirmCardStyle = {
  marginTop: 16,
  border: "1px solid #fca5a5",
  background: "#ffffff",
  borderRadius: 18,
  padding: 16,
};

const dangerConfirmTitleStyle = {
  fontWeight: 700,
  color: "#7f1d1d",
  marginBottom: 8,
};

const dangerConfirmTextStyle = {
  color: "#7f1d1d",
  lineHeight: 1.7,
  fontSize: 14,
};

const archivedBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#475569",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 13,
  fontWeight: 700,
};

const workflowHeaderStackStyle = {
  marginTop: 14,
  display: "grid",
  gap: 12,
};

const contentManagementWorkspaceStyle = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(320px, 1fr)",
  gap: 12,
  alignItems: "start",
};

const contentManagementPanelStyle = {
  background: "#fafbfd",
  border: "1px solid #e8edf3",
  borderRadius: 22,
  padding: 18,
  display: "grid",
  gap: 14,
};

const contentManagementPanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

const contentManagementTitleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
};

const contentManagementPanelMetaStyle = {
  color: "#6b7280",
  fontSize: 13,
  lineHeight: 1.5,
  maxWidth: 280,
};

function selectedWorkspaceModeBadgeStyle(mode = "dashboard") {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    border:
      mode === "pipeline"
        ? "1px solid #cbd5e1"
        : mode === "content_studio"
          ? "1px solid #d7e8dc"
          : "1px solid #dbe2ea",
    background:
      mode === "pipeline"
        ? "#f8fafc"
        : mode === "content_studio"
          ? "#fbfefc"
          : "#ffffff",
    color:
      mode === "pipeline"
        ? "#334155"
        : mode === "content_studio"
          ? "#355b48"
          : "#475569",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };
}

const selectedWorkspaceSummaryStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

const dashboardWorkspaceStyle = {
  marginTop: 14,
  display: "grid",
  gap: 14,
};

const dashboardSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

function dashboardSummaryCardStyle(tone = "neutral") {
  if (tone === "success") {
    return {
      display: "grid",
      gap: 6,
      padding: "16px 18px",
      borderRadius: 20,
      border: "1px solid #dfe9e2",
      background: "#f9fbfa",
      color: "#1f5137",
    };
  }

  if (tone === "warn") {
    return {
      display: "grid",
      gap: 6,
      padding: "16px 18px",
      borderRadius: 20,
      border: "1px solid #f1e4d5",
      background: "#fffaf4",
      color: "#8a4b16",
    };
  }

  return {
    display: "grid",
    gap: 6,
    padding: "16px 18px",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#334155",
  };
}

const dashboardSummaryLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

const dashboardSummaryValueStyle = {
  fontSize: 22,
  lineHeight: 1.15,
  fontWeight: 700,
};

const dashboardSummaryMetaStyle = {
  fontSize: 13,
  lineHeight: 1.5,
};

const dashboardNextStepCardStyle = {
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  borderRadius: 20,
  padding: "16px 18px",
  display: "grid",
  gap: 6,
};

const dashboardNextStepLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

const dashboardNextStepTextStyle = {
  color: "#0f172a",
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 600,
};

const dashboardNextStepHintStyle = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.5,
};

const dashboardActionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

function dashboardActionCardStyle(isRecommended = false) {
  return {
    textAlign: "left",
    border: isRecommended ? "1px solid #0f172a" : "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 22,
    padding: 18,
    display: "grid",
    gap: 8,
    cursor: "pointer",
  };
}

const dashboardActionLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

const dashboardActionTitleStyle = {
  fontSize: 20,
  lineHeight: 1.2,
  fontWeight: 700,
  color: "#0f172a",
};

const dashboardActionDescriptionStyle = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.6,
};

const dashboardActionBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const operationsBoardStyle = {
  marginTop: 28,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 28,
  padding: 22,
  display: "grid",
  gap: 18,
};

const operationsBoardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

const operationsBoardMetaStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
  maxWidth: 360,
};

const operationsControlsRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

const operationsFilterPillRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

function operationsFilterPillStyle(isActive = false) {
  return {
    padding: "9px 12px",
    borderRadius: 999,
    border: isActive ? "1px solid #0f172a" : "1px solid #cbd5e1",
    background: isActive ? "#0f172a" : "#ffffff",
    color: isActive ? "#ffffff" : "#334155",
    fontSize: 13,
    lineHeight: 1.3,
    fontWeight: 700,
    cursor: "pointer",
  };
}

const operationsSortControlStyle = {
  display: "grid",
  gap: 6,
  minWidth: 180,
};

const operationsSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const operationsSummaryCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#f8fafc",
  padding: "16px 18px",
  display: "grid",
  gap: 8,
};

const operationsSummaryLabelStyle = {
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const operationsSummaryValueStyle = {
  color: "#0f172a",
  fontSize: 28,
  lineHeight: 1.1,
  fontWeight: 700,
};

const operationsQueueGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  alignItems: "start",
};

const operationsQueueColumnStyle = {
  display: "grid",
  gap: 14,
  alignContent: "start",
};

const operationsQueueHeaderStyle = {
  display: "grid",
  gap: 6,
};

const operationsQueueMetaStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

const operationsBucketSectionStyle = {
  display: "grid",
  gap: 12,
};

const operationsBucketHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const operationsBucketTitleStyle = {
  fontSize: 15,
  lineHeight: 1.4,
  fontWeight: 700,
  color: "#0f172a",
};

const operationsBucketCountStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 34,
  height: 34,
  padding: "0 10px",
  borderRadius: 999,
  background: "#e2e8f0",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 700,
};

const operationsCardListStyle = {
  display: "grid",
  gap: 12,
};

function operationsCardStyle(urgency = "none", isSelected = false) {
  const borderColor =
    urgency === "high"
      ? "#fdba74"
      : urgency === "medium"
        ? "#cbd5e1"
        : urgency === "low"
          ? "#d7e8dc"
          : "#e2e8f0";

  return {
    border: isSelected ? "2px solid #0f172a" : `1px solid ${borderColor}`,
    borderRadius: 22,
    background: "#ffffff",
    padding: 18,
    display: "grid",
    gap: 12,
    boxShadow: isSelected ? "0 0 0 2px rgba(15, 23, 42, 0.08)" : "none",
  };
}

const operationsCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
};

const operationsCardNameStyle = {
  color: "#0f172a",
  fontSize: 18,
  lineHeight: 1.2,
  fontWeight: 700,
};

const operationsCardMetaStyle = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
  marginTop: 4,
};

const operationsBadgeRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

function operationsBucketBadgeStyle(type = "production") {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "7px 10px",
    background: type === "production" ? "#eef2ff" : "#ecfdf5",
    color: type === "production" ? "#0f172a" : "#166534",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 700,
  };
}

function operationsUrgencyBadgeStyle(urgency = "none") {
  if (urgency === "high") {
    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "7px 10px",
      background: "#fff7ed",
      color: "#9a3412",
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
    };
  }

  if (urgency === "medium") {
    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "7px 10px",
      background: "#eff6ff",
      color: "#1d4ed8",
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
    };
  }

  if (urgency === "low") {
    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "7px 10px",
      background: "#ecfdf5",
      color: "#166534",
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 700,
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "7px 10px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 700,
  };
}

const operationsActionLabelStyle = {
  color: "#64748b",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const operationsActionTextStyle = {
  color: "#0f172a",
  fontSize: 18,
  lineHeight: 1.45,
  fontWeight: 700,
};

const operationsReasonTextStyle = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.6,
};

const operationsCardActionRowStyle = {
  display: "flex",
  justifyContent: "flex-start",
};

const operationsEmptyStateStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 22,
  background: "#f8fafc",
  padding: 18,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

const workflowHeaderPanelStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 20,
  display: "grid",
  gap: 14,
};

const workflowSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const contentManagementOverviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

function contentManagementMetricCardStyle(tone = "neutral", isSubtleSignal = false) {
  if (tone === "success") {
    return {
      display: "grid",
      gap: 7,
      padding: "13px 15px",
      borderRadius: 18,
      border: isSubtleSignal ? "1px solid #d7e8dc" : "1px solid #dfe9e2",
      background: isSubtleSignal ? "#fbfefc" : "#f8fbf9",
      color: "#1f5137",
      minWidth: 0,
      alignContent: "start",
    };
  }

  if (tone === "warn") {
    return {
      display: "grid",
      gap: 7,
      padding: "13px 15px",
      borderRadius: 18,
      border: isSubtleSignal ? "1px solid #efe0cf" : "1px solid #f1e4d5",
      background: isSubtleSignal ? "#fffdfa" : "#fffaf4",
      color: "#8a4b16",
      minWidth: 0,
      alignContent: "start",
    };
  }

  return {
    display: "grid",
    gap: 7,
    padding: "13px 15px",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#fcfdff",
    color: "#334155",
    minWidth: 0,
    alignContent: "start",
  };
}

function contentManagementMetricLabelStyle(tone = "neutral") {
  return {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 700,
    opacity: 1,
    color:
      tone === "success"
        ? "#355b48"
        : tone === "warn"
          ? "#7c4a15"
          : "#475569",
  };
}

const contentManagementMetricValueStyle = {
  fontSize: 16,
  lineHeight: 1.3,
  fontWeight: 700,
  minWidth: 0,
};

const contentManagementMetricMetaTextStyle = {
  fontSize: 13,
  lineHeight: 1.5,
};

const contentManagementAssetListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 2,
};

function contentManagementAssetBadgeStyle(isComplete = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    border: isComplete ? "1px solid #d7e8dc" : "1px solid #e2e8f0",
    background: isComplete ? "#f9fdf9" : "#ffffff",
    color: isComplete ? "#2f6a47" : "#64748b",
  };
}

const contentManagementActionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const contentStudioWorkspaceStackStyle = {
  display: "grid",
  gap: 20,
};

const contentStudioDraftSectionStyle = {
  marginTop: 14,
  display: "grid",
  gap: 14,
};

const contentStudioDraftHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

const contentStudioDraftGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 14,
};

const contentStudioStoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const contentStudioReadonlyFieldStyle = {
  ...inputStyle,
  background: "#f8fafc",
  color: "#334155",
  resize: "none",
};

const contentStudioSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const contentStudioSectionActionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const contentStudioFieldStackStyle = {
  display: "grid",
  gap: 14,
};

const contentStudioChoiceListStyle = {
  display: "grid",
  gap: 10,
  marginTop: 14,
};

const contentStudioChoiceCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: "12px 14px",
  display: "grid",
  gap: 6,
};

const contentStudioChoiceEditorCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: "12px 14px",
  display: "grid",
  gap: 12,
};

const contentStudioChoiceLabelStyle = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

const contentStudioChoiceResultStyle = {
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.6,
};

const contentManagementGuidanceStyle = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
};

const contentManagementGuidanceLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

const contentManagementGuidanceTextStyle = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 500,
};

function contentManagementActionButtonStyle(variant = "primary", isDisabled = false) {
  const baseStyle =
    variant === "secondary"
      ? {
          ...secondaryButton,
          width: "100%",
          padding: "12px 14px",
          fontSize: 14,
          fontWeight: 700,
        }
      : {
          ...primaryButton,
          width: "100%",
          padding: "12px 14px",
          fontSize: 14,
          fontWeight: 700,
        };

  return isDisabled ? disabledActionStyle(baseStyle) : baseStyle;
}

function contentStudioSectionButtonStyle(variant = "secondary", isDisabled = false) {
  const baseStyle =
    variant === "primary"
      ? {
          ...primaryButton,
          padding: "10px 14px",
          fontSize: 14,
          borderRadius: 14,
        }
      : {
          ...secondaryButton,
          padding: "10px 14px",
          fontSize: 14,
          borderRadius: 14,
        };

  return isDisabled ? disabledActionStyle(baseStyle) : baseStyle;
}

const pipelineProgressTrackStyle = {
  height: 8,
  background: "#e2e8f0",
  borderRadius: 999,
};

const pipelineProgressFillStyle = {
  height: "100%",
  background: "#0f172a",
  borderRadius: 999,
};

const pipelineStageGridStyle = {
  display: "grid",
  width: "100%",
  minWidth: 0,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 8,
  alignItems: "stretch",
  justifyItems: "stretch",
  justifyContent: "stretch",
  gridAutoRows: "1fr",
};

const pipelineStageSectionStyle = {
  width: "100%",
  minWidth: 0,
  display: "grid",
};

const pipelineStageActionRowStyle = {
  marginTop: 10,
};

const pipelineStageCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

function pipelineStageNumberStyle(status = "locked") {
  return {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 700,
    color:
      status === "open"
        ? "rgba(255, 255, 255, 0.74)"
        : status === "completed"
          ? "#15803d"
          : "#64748b",
  };
}

function pipelineStageNameStyle(status = "locked") {
  return {
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.25,
    color:
      status === "open"
        ? "#ffffff"
        : status === "completed"
          ? "#166534"
          : "#0f172a",
  };
}

function pipelineStageStatusIconStyle(status = "locked") {
  if (status === "completed") {
    return {
      width: 28,
      height: 28,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "#ffffff",
      color: "#166534",
      border: "1px solid #86efac",
      flexShrink: 0,
    };
  }

  if (status === "open") {
    return {
      width: 28,
      height: 28,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "rgba(255, 255, 255, 0.12)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      flexShrink: 0,
    };
  }

  return {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    flexShrink: 0,
  };
}

function pipelineStageStatusIcon(status = "locked") {
  if (status === "completed") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M3.25 8.25 6.45 11.2 12.75 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "open") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M11.1 6V4.85A3.1 3.1 0 0 0 8 1.75a3.1 3.1 0 0 0-3.1 3.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="2.9"
          y="6"
          width="10.2"
          height="7.9"
          rx="2.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M4.9 6V4.85A3.1 3.1 0 0 1 8 1.75a3.1 3.1 0 0 1 3.1 3.1V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2.9"
        y="6"
        width="10.2"
        height="7.9"
        rx="2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const departmentsSectionStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: "16px 20px",
};

function overviewViewButtonStyle(isActive = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    border: isActive ? "1px solid #0f172a" : "1px solid #cbd5e1",
    background: isActive ? "#0f172a" : "#ffffff",
    color: isActive ? "#ffffff" : "#334155",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: "pointer",
  };
}

const departmentsRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

function departmentPillStyle(isActive = false) {
  return {
    padding: "12px 18px",
    borderRadius: 16,
    border: isActive ? "1px solid #0f172a" : "1px solid #cbd5e1",
    background: isActive ? "#0f172a" : "#fff",
    color: isActive ? "#fff" : "#0f172a",
    cursor: "pointer",
    fontSize: 15,
    minHeight: 48,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

const hintStackStyle = {
  display: "grid",
  gap: 10,
};

const inlineValidationHintStyle = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#64748b",
};

const workflowFeedbackSlotStyle = {
  minHeight: 40,
  display: "grid",
  alignItems: "start",
};

function workflowFeedbackMessageStyle(tone = "success", isVisible = true) {
  const baseStyle = {
    padding: "8px 10px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
    minHeight: 40,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? "visible" : "hidden",
    transition: "opacity 160ms ease, visibility 160ms ease",
  };

  if (tone === "error") {
    return {
      ...baseStyle,
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    };
  }

  if (tone === "muted") {
    return {
      ...baseStyle,
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      color: "#475569",
    };
  }

  return {
    ...baseStyle,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  };
}

const workflowGuidanceRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "baseline",
};

const workflowGuidanceLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

function workflowGuidanceTextStyle(tone = "muted") {
  return {
    color:
      tone === "success"
        ? "#166534"
        : tone === "warn"
          ? "#9a3412"
          : "#334155",
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: 500,
    flex: "1 1 0%",
    minWidth: 0,
  };
}

function operatorHintStyle(tone = "muted") {
  if (tone === "success") {
    return {
      background: "#ecfdf5",
      border: "1px solid #86efac",
      borderRadius: 14,
      padding: "10px 12px",
      color: "#166534",
      fontSize: 14,
      lineHeight: 1.6,
    };
  }

  if (tone === "warn") {
    return {
      background: "#fff7ed",
      border: "1px solid #fdba74",
      borderRadius: 14,
      padding: "10px 12px",
      color: "#9a3412",
      fontSize: 14,
      lineHeight: 1.6,
    };
  }

  return {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "10px 12px",
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.6,
  };
}

function statusPillStyle(tone = "neutral") {
  if (tone === "success") {
    return {
      display: "grid",
      gap: 6,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid #86efac",
      background: "#ecfdf5",
      color: "#166534",
      minWidth: 160,
    };
  }

  if (tone === "warn") {
    return {
      display: "grid",
      gap: 6,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid #fdba74",
      background: "#fff7ed",
      color: "#9a3412",
      minWidth: 160,
    };
  }

  return {
    display: "grid",
    gap: 6,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    minWidth: 160,
  };
}

function pipelineStageCardStyle(status = "locked", isActive = false) {
  const activeShadow =
    status === "completed"
      ? "0 0 0 2px rgba(22, 101, 52, 0.16)"
      : status === "open"
        ? "0 0 0 2px rgba(15, 23, 42, 0.18)"
        : "0 0 0 2px rgba(71, 85, 105, 0.14)";
  const baseStyle = {
    padding: "12px",
    borderRadius: 16,
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    gap: 8,
    width: "100%",
    minWidth: 0,
    maxWidth: "none",
    minHeight: 132,
    height: "100%",
    alignContent: "start",
    boxSizing: "border-box",
    cursor: "pointer",
    boxShadow: isActive ? activeShadow : "none",
    justifySelf: "stretch",
    alignSelf: "stretch",
  };

  if (status === "completed") {
    return {
      ...baseStyle,
      border: "1px solid #86efac",
      background: "#ecfdf5",
      color: "#166534",
    };
  }

  if (status === "open") {
    return {
      ...baseStyle,
      border: "1px solid #0f172a",
      background: "#0f172a",
      color: "#ffffff",
    };
  }

  return {
    ...baseStyle,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#475569",
  };
}

function pipelineStageActionButtonStyle(status = "open", isBusy = false) {
  const baseStyle =
    status === "open"
      ? {
          width: "100%",
          background: "#ffffff",
          color: "#0f172a",
          border: "none",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }
      : {
          ...primaryButton,
          width: "100%",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
        };

  return isBusy
    ? {
        ...baseStyle,
        opacity: 0.72,
        cursor: "not-allowed",
      }
    : baseStyle;
}

function pipelineStageSecondaryActionButtonStyle(status = "completed", isBusy = false) {
  const baseStyle =
    status === "completed"
      ? {
          width: "100%",
          background: "#ffffff",
          color: "#166534",
          border: "1px solid #86efac",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }
      : {
          ...secondaryButton,
          width: "100%",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 13,
          fontWeight: 700,
        };

  return isBusy
    ? {
        ...baseStyle,
        opacity: 0.72,
        cursor: "not-allowed",
      }
    : baseStyle;
}

const actionWarningOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1000,
};

const actionWarningModalStyle = {
  width: "100%",
  maxWidth: 560,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)",
};

const actionWarningTitleStyle = {
  fontSize: 26,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 14,
};

const actionWarningTextStyle = {
  color: "#475569",
  lineHeight: 1.7,
  fontSize: 15,
};

const actionWarningListStyle = {
  marginTop: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "12px 14px",
  color: "#334155",
  lineHeight: 1.6,
  fontSize: 14,
  fontWeight: 600,
};

const actionWarningActionsStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 20,
};

const visualPlaceholderStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  minHeight: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "linear-gradient(135deg, #f5efe6 0%, #f1f5f9 100%)",
  padding: 20,
};

const sectionLabelStyle = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  marginBottom: 12,
  fontWeight: 700,
};

const subduedSectionLabelStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#a3b1c2",
  marginBottom: 10,
  fontWeight: 600,
};

const mutedTextStyle = {
  color: "#64748b",
  lineHeight: 1.7,
  fontSize: 15,
  margin: 0,
};

const contentCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

const dollIdentityCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: "18px 20px 16px",
  display: "grid",
  gap: 12,
  boxShadow: "none",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
};

const dollIdentityHeaderRowStyle = {
  display: "grid",
  gap: 8,
};

const dollIdentityLeadStyle = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gap: 0,
};

const dollIdentityPrimaryStyle = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gap: 7,
};

const dollIdentitySupportingInfoStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

const dollIdentityIdStyle = {
  fontSize: 12.5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 600,
};

const dollIdentityInfoDividerStyle = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: "rgba(100, 116, 139, 0.55)",
  flexShrink: 0,
};

const dollIdentityNameStyle = {
  fontSize: 22,
  lineHeight: 1.15,
  fontWeight: 700,
  color: "#0f172a",
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const dollIdentityThemeStyle = {
  color: "#64748b",
  fontSize: 12.5,
  lineHeight: 1.35,
  fontWeight: 500,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const dollIdentityStatusStyle = {
  display: "grid",
  gap: 4,
  alignContent: "start",
  minWidth: 0,
};

function dollIdentityStageBadgeStyle(status = "locked") {
  return {
    fontSize: 11,
    lineHeight: 1.25,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(100, 116, 139, 0.78)",
    fontWeight: 600,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

function dollIdentityStatusStateStyle(status = "locked") {
  return {
    color: "#1e293b",
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 600,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

const dollIdentityDividerStyle = {
  width: "100%",
  height: 1,
  background:
    "linear-gradient(90deg, rgba(148,163,184,0) 0%, rgba(148,163,184,0.28) 14%, rgba(148,163,184,0.28) 86%, rgba(148,163,184,0) 100%)",
};

const dollIdentityMetaStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  alignItems: "start",
};

const dollIdentityMetaStyle = {
  display: "grid",
  gap: 4,
  alignContent: "start",
  minWidth: 0,
};

const dollIdentityMetaLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(100, 116, 139, 0.78)",
  fontWeight: 600,
};

function dollIdentityMetaValueStyle(isEmpty = false) {
  return {
    color: isEmpty ? "#475569" : "#1e293b",
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 600,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

const dollIdentityMetaHintStyle = {
  color: "rgba(100, 116, 139, 0.76)",
  fontSize: 11.5,
  lineHeight: 1.35,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const printCardWrapperStyle = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};

const printCardStyle = {
  width: 280,
  background: "#fffaf5",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 20,
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const printCardNameStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 8,
};

const printCardTextStyle = {
  fontSize: 14,
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 16,
};

const printCardQrStyle = {
  width: 180,
  height: 180,
  objectFit: "contain",
  borderRadius: 16,
  background: "#ffffff",
  padding: 10,
  border: "1px solid #e5e7eb",
};

const printCardBrandStyle = {
  marginTop: 14,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};

const versionFooterStyle = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid #e2e8f0",
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.6,
  textAlign: "left",
  overflowWrap: "anywhere",
};
