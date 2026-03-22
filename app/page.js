"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";

const DEFAULT_THEMES = [
  "Unassigned",
  "Nature Friends",
  "Little Dreamers",
  "Cozy World",
];
const STORY_TONES = ["Gentle", "Playful", "Magical"];
const STATUSES = ["new", "identity", "story", "digital", "content", "sales"];
const PRODUCTION_STAGES = [
  { value: 1, label: "Registered" },
  { value: 2, label: "Character" },
  { value: 3, label: "Content" },
  { value: 4, label: "Gateway" },
  { value: 5, label: "Ready" },
];
const DEPARTMENTS = [
  "Overview",
  "Production",
  "Character",
  "Content",
  "Digital",
  "Commerce",
  "Danger Zone",
];
const ADMIN_AUTH_STORAGE_KEY = "doll_admin_authenticated";
const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() ||
  process.env.ADMIN_PASSWORD?.trim() ||
  "";

function normalizeLifecycleStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "live" ? "sales" : normalized;
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
    commercial_status: "Missing sale status",
  };

  return labels[key] || `Missing ${formatStatusToken(key)}`;
}

function progressFromStatus(status) {
  const idx = STATUSES.indexOf(normalizeLifecycleStatus(status) || "new");
  return idx >= 0 ? Math.round(((idx + 1) / STATUSES.length) * 100) : 0;
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
  const [savedStorySnapshot, setSavedStorySnapshot] = useState(null);

  const [contentPack, setContentPack] = useState(emptyContentPackState);
  const [contentPackGenerating, setContentPackGenerating] = useState(false);
  const [contentPackSaving, setContentPackSaving] = useState(false);
  const [savedContentPackSnapshot, setSavedContentPackSnapshot] = useState(null);

  const [order, setOrder] = useState(emptyOrderState);
  const [socialGenerating, setSocialGenerating] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [savedSocialSnapshot, setSavedSocialSnapshot] = useState(null);

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const [showQrRegenerateWarning, setShowQrRegenerateWarning] = useState(false);
  const [dangerAction, setDangerAction] = useState(null);
  const [dangerConfirmText, setDangerConfirmText] = useState("");
  const [dangerLoading, setDangerLoading] = useState("");
  const printCardRef = useRef(null);
  const slugLockRef = useRef({ id: null, legacyLockedSlug: "" });

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("");

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
  const legacyLifecycleStatus = normalizeLifecycleStatus(selected?.status);
  const rawProductionStage = selected?.production_stage;
  const parsedProductionStage =
    rawProductionStage === null || rawProductionStage === undefined || rawProductionStage === ""
      ? NaN
      : Number(rawProductionStage);
  const effectiveProductionStage = Number.isFinite(parsedProductionStage)
    ? parsedProductionStage
    : legacyLifecycleStatus === "digital"
      ? 4
      : ["content", "sales"].includes(legacyLifecycleStatus)
        ? 5
        : 1;
  const legacySalesStatus = (selected?.sales_status || "").toLowerCase();
  const legacyAvailabilityStatus = (selected?.availability_status || "").toLowerCase();
  const effectiveCommercialStatus =
    typeof selected?.commercial_status === "string" && selected.commercial_status.trim()
      ? selected.commercial_status.trim().toLowerCase()
      : legacySalesStatus === "sold"
        ? "sold"
        : legacySalesStatus === "reserved"
          ? "reserved"
          : legacyAvailabilityStatus === "assigned"
            ? "sold"
            : "not_for_sale";
  const effectiveAccessStatus =
    typeof selected?.access_status === "string" && selected.access_status.trim()
      ? selected.access_status.trim().toLowerCase()
      : selected?.qr_code_url
        ? "generated"
        : "not_generated";
  const effectiveLifecycleStatus =
    typeof selected?.status === "string" && selected.status.trim()
      ? normalizeLifecycleStatus(selected.status)
      : effectiveProductionStage >= 5
        ? "sales"
        : effectiveProductionStage >= 4
          ? "digital"
          : "new";
  const pipelineStageNumber = selected
    ? Math.min(Math.max(Math.round(effectiveProductionStage || 1), 1), PRODUCTION_STAGES.length)
    : 0;
  const pipelineStageLabel =
    PRODUCTION_STAGES.find((stage) => stage.value === pipelineStageNumber)?.label || "Not set";
  const qrSalesStatus = effectiveCommercialStatus;
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
    if (!["for_sale", "reserved", "sold"].includes(effectiveCommercialStatus)) {
      commercialMissing.push("commercial_status");
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
    effectiveCommercialStatus,
  ]);
  const readinessOverviewItems = [
    { key: "production", label: "Production", state: selectedReadiness.production },
    { key: "character", label: "Character", state: selectedReadiness.character },
    { key: "content", label: "Content", state: selectedReadiness.content },
    { key: "digital", label: "Digital", state: selectedReadiness.digital },
    { key: "commercial", label: "Commercial", state: selectedReadiness.commercial },
  ];
  const readinessCompleteCount = readinessOverviewItems.filter((item) => item.state.complete).length;
  const readinessStatusLabel = selectedReadiness.overall
    ? "Ready"
    : readinessCompleteCount > 0
      ? "In progress"
      : "Not ready";
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
  const workspaceNextStepMessage = (() => {
    if (!selectedReadiness.production.complete) {
      if (selectedReadiness.production.missing.includes("image_url")) {
        return "Next step: add the doll image in Production.";
      }

      return "Next step: complete Production before advancing this doll.";
    }

    if (!selectedReadiness.character.complete) {
      return "Next step: complete Character before advancing to Content.";
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

      return "Next step: complete Content before advancing to Gateway.";
    }

    if (!selectedReadiness.digital.complete) {
      if (selectedReadiness.digital.missing.includes("qr_code_url") && qrReady) {
        return "Next step: generate the QR code in Digital.";
      }

      return "Next step: finish the Digital setup.";
    }

    if (!selectedReadiness.commercial.complete) {
      return "Next step: complete Commerce to progress this doll into order flow.";
    }

    return "All production stages are complete.";
  })();
  const overviewNextActionMessage = (() => {
    if (!selectedReadiness.production.complete) {
      if (selectedReadiness.production.missing.includes("image_url")) {
        return "Go to Production and add the doll image.";
      }

      return "Go to Production and complete the missing details.";
    }

    if (!selectedReadiness.character.complete) {
      return "Go to Character and complete the identity details.";
    }

    if (!selectedReadiness.content.complete) {
      if (selectedReadiness.content.missing.includes("story_content")) {
        return "Go to Content and complete the story.";
      }

      if (selectedReadiness.content.missing.includes("content_pack")) {
        return "Go to Content and complete the content pack.";
      }

      if (selectedReadiness.content.missing.includes("social_content")) {
        return "Go to Content and complete social content.";
      }

      return "Go to Content and finish the remaining content.";
    }

    if (!selectedReadiness.digital.complete) {
      if (selectedReadiness.digital.missing.includes("qr_code_url") && qrReady) {
        return "Go to Digital and generate the QR code.";
      }

      return "Go to Digital and finish the public link setup.";
    }

    if (!selectedReadiness.commercial.complete) {
      return "Go to Commerce and set the order status.";
    }

    return "This doll is fully configured.";
  })();
  const currentDepartment = selected ? activeDepartment || "Overview" : "";
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

    const mapped = (data || []).map((d) => ({
      ...d,
      theme_name: d.theme_name || "Unassigned",
    }));

    setDolls(mapped);

    if (!selectedId && mapped.length) {
      setSelectedId(mapped[0].id);
    }
  }

  async function loadDetails(dollId) {
    if (!dollId) return;
    setError("");

    const doll = dolls.find((d) => d.id === dollId);

    if (doll) {
      const nextIdentity = {
        name: doll.name || "",
        theme_name: doll.theme_name || "Unassigned",
        personality_traits: doll.personality_traits || "",
        emotional_hook: doll.emotional_hook || "",
        social_hook: doll.social_hook || "",
        social_caption: doll.social_caption || "",
        social_cta: doll.social_cta || "",
        social_status: doll.social_status || "draft",
        short_intro: doll.short_intro || "",
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

    const nextStory = {
      teaser,
      mainStory,
      mini1: minis[0]?.content || "",
      mini2: minis[1]?.content || "",
    };

    setStory(nextStory);
    setSavedStorySnapshot((stories || []).length ? buildStorySectionSnapshot(nextStory) : null);

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
    setStorySaving(false);
    setContentPackGenerating(false);
    setContentPackSaving(false);
    setSocialGenerating(false);
    setSocialSaving(false);
  }, [selectedId]);

  useEffect(() => {
    setActiveDepartment(selected ? "Overview" : "");
  }, [selected?.id]);

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

    const payload = {
      internal_id: `DOLL-${String(count).padStart(3, "0")}`,
      name: computedName,
      artist_name: newArtistName || null,
      theme_name: newTheme || "Unassigned",
      status: "new",
      availability_status: "available",
      sales_status: "not_sold",
      slug: slugify(computedName),
    };

    const { data, error } = await supabase
      .from("dolls")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    const next = {
      ...data,
      theme_name: data.theme_name || "Unassigned",
    };

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

      const generatedMainStory =
        typeof data?.result?.story_main === "string"
          ? data.result.story_main.trim()
          : "";

      if (!generatedMainStory) {
        throw new Error("Story generation returned an empty result.");
      }

      setStory({
        teaser: pack.teaser,
        mainStory: generatedMainStory,
        mini1: pack.mini1,
        mini2: pack.mini2,
      });

      setNotice(`${tone} story pack generated.`);
    } catch (err) {
      setError(err?.message || "Failed to generate story.");
    } finally {
      setStoryGenerating(false);
    }
  }

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

  function generateDraft() {
    if (!selected) return;

    const pack = buildStoryPack({ ...selected, ...identity }, storyTone);

    setStory({
      teaser: pack.teaser,
      mainStory: pack.mainStory,
      mini1: pack.mini1,
      mini2: pack.mini2,
    });

    setNotice("Draft generated.");
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
      const nextContentPack = {
        caption: typeof result.short_intro === "string" ? result.short_intro.trim() : "",
        hook: typeof result.promo_hook === "string" ? result.promo_hook.trim() : "",
        blurb: typeof result.content_blurb === "string" ? result.content_blurb.trim() : "",
        cta: typeof result.cta === "string" ? result.cta.trim() : "",
      };

      if (!nextContentPack.caption || !nextContentPack.hook || !nextContentPack.blurb || !nextContentPack.cta) {
        throw new Error("Content pack generation returned incomplete data.");
      }

      setContentPack(nextContentPack);
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
      const nextSocialContent = {
        social_hook: typeof result.social_hook === "string" ? result.social_hook.trim() : "",
        social_caption:
          typeof result.social_caption === "string" ? result.social_caption.trim() : "",
        social_cta: typeof result.social_cta === "string" ? result.social_cta.trim() : "",
      };

      if (!nextSocialContent.social_hook || !nextSocialContent.social_caption || !nextSocialContent.social_cta) {
        throw new Error("Social generation returned incomplete data.");
      }

      setIdentity((prev) => ({
        ...prev,
        social_hook: nextSocialContent.social_hook,
        social_caption: nextSocialContent.social_caption,
        social_cta: nextSocialContent.social_cta,
      }));
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

  async function saveOrder() {
    if (!selected) return;

    setError("");
    setNotice("");

    const nextSalesStatus = order.order_status === "delivered" ? "sold" : "reserved";
    const saleTransitionBlocked =
      !selectedReadiness.overall &&
      (nextSalesStatus !== effectiveCommercialStatus || selected.status !== "sales");

    await supabase.from("orders").delete().eq("doll_id", selected.id);

    const { error } = await supabase.from("orders").insert({
      doll_id: selected.id,
      customer_name: order.customer_name,
      order_status: order.order_status,
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

  const metrics = {
    total: dolls.length,
    commerce: dolls.filter((d) => normalizeLifecycleStatus(d.status) === "sales").length,
    available: dolls.filter((d) => d.availability_status === "available").length,
    sold: dolls.filter((d) => d.sales_status === "sold").length,
  };
  const productionDepartmentContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Record ID</div>
          <div style={{ fontWeight: 700 }}>{selected?.internal_id || "Not assigned"}</div>
        </div>

        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Artist</div>
          <div style={{ fontWeight: 700 }}>{selected?.artist_name || "Not set"}</div>
        </div>

        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Production Stage</div>
          <div style={{ fontWeight: 700 }}>{pipelineStageNumber} - {pipelineStageLabel}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={contentCardStyle}>
          <label style={labelStyle}>Color Palette</label>
          <input
            value={identity.color_palette}
            onChange={(e) => setIdentity({ ...identity, color_palette: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={contentCardStyle}>
          <label style={labelStyle}>Notable Features</label>
          <textarea
            value={identity.notable_features}
            onChange={(e) => setIdentity({ ...identity, notable_features: e.target.value })}
            style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
          />
        </div>
      </div>

      {!selectedReadiness.production.complete ? (
        <div style={hintStackStyle}>
          {selectedReadiness.production.missing.map((item) => (
            <div key={item} style={operatorHintStyle("warn")}>
              {readinessMissingLabel(item)}
            </div>
          ))}
        </div>
      ) : null}

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
                  Add a doll image to complete the production record.
                </div>
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

      <div>
        <button onClick={saveIdentity} style={primaryButton}>Save Production Details</button>
      </div>
    </div>
  );
  const characterDepartmentContent = (
    <div style={{ marginTop: 24 }}>
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
    </div>
  );
  const contentDepartmentContent = (
    <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
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

        <div>
          <label style={labelStyle}>Card teaser</label>
          <textarea value={story.teaser} onChange={(e) => setStory({ ...story, teaser: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Main story</label>
          <textarea value={story.mainStory} onChange={(e) => setStory({ ...story, mainStory: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
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

        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Instagram Caption</div>
          <textarea
            value={contentPack.caption}
            onChange={(e) => setContentPack({ ...contentPack, caption: e.target.value })}
            style={{ ...inputStyle, minHeight: 140 }}
          />
        </div>

        <div style={contentGridStyle}>
          <div style={contentCardStyle}>
            <div style={sectionLabelStyle}>Short Promo Hook</div>
            <textarea
              value={contentPack.hook}
              onChange={(e) => setContentPack({ ...contentPack, hook: e.target.value })}
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>

          <div style={contentCardStyle}>
            <div style={sectionLabelStyle}>CTA</div>
            <textarea
              value={contentPack.cta}
              onChange={(e) => setContentPack({ ...contentPack, cta: e.target.value })}
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>
        </div>

        <div style={contentCardStyle}>
          <div style={sectionLabelStyle}>Product Blurb</div>
          <textarea
            value={contentPack.blurb}
            onChange={(e) => setContentPack({ ...contentPack, blurb: e.target.value })}
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

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Hook</label>
              <input
                value={identity.social_hook}
                onChange={(e) => setIdentity({ ...identity, social_hook: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Caption</label>
              <textarea
                value={identity.social_caption}
                onChange={(e) => setIdentity({ ...identity, social_caption: e.target.value })}
                style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={labelStyle}>CTA</label>
              <input
                value={identity.social_cta}
                onChange={(e) => setIdentity({ ...identity, social_cta: e.target.value })}
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
            <button onClick={activateDigitalLayer} style={primaryButton}>
              Activate Digital Layer
            </button>

            <button
              onClick={savedQrUrl ? requestQrRegeneration : generateQrCode}
              style={savedQrUrl ? secondaryButton : primaryButton}
              disabled={!publicUrl || qrUploading || !qrReady}
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
                  style={dangerButton}
                  disabled={qrUploading}
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 28 }}>
          {[
            ["Total Dolls", metrics.total],
            ["In Commerce", metrics.commerce],
            ["Available", metrics.available],
            ["Sold", metrics.sold],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 24 }}>
              <div style={{ color: "#64748b", fontSize: 16 }}>{label}</div>
              <div style={{ fontSize: 42, marginTop: 10, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 24, marginTop: 28 }}>
          <section
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22 }}
            data-selected-readiness={selectedReadiness.overall ? "ready" : "incomplete"}
          >
            <h2 style={{ marginTop: 0, fontSize: 24 }}>Create &amp; Select Dolls</h2>

            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Doll name or temporary label</label>
              <input value={newDollName} onChange={(e) => setNewDollName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Artist name</label>
              <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Theme</label>
              <select value={newTheme} onChange={(e) => setNewTheme(e.target.value)} style={inputStyle}>
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={createDoll} style={primaryButton}>Create Intake Entry</button>
              <button onClick={() => { loadThemes(); loadDolls(); }} style={secondaryButton}>Refresh</button>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 22, paddingTop: 18 }}>
              <div style={{ color: "#64748b", marginBottom: 14 }}>Dolls</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {dolls.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
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

                    <div style={{ marginTop: 14, height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                      <div style={{ width: `${progressFromStatus(d.status)}%`, height: "100%", background: "#0f172a", borderRadius: 999 }} />
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
                    <div style={{ color: "#64748b", marginTop: 6 }}>
                      {selected.internal_id} · {identity.theme_name || "Unassigned"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={generateDraft} style={secondaryButton}>Generate Content Draft</button>
                    <button onClick={advanceStage} style={primaryButton}>Advance Production Stage</button>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 18,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 22,
                    padding: 20,
                    display: "grid",
                    gap: 18,
                  }}
                >
                  <div>
                    <div style={{ ...sectionLabelStyle, marginBottom: 10 }}>Pipeline</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {PRODUCTION_STAGES.map((stage) => {
                        const isCurrent = stage.value === pipelineStageNumber;

                        return (
                          <div
                            key={stage.value}
                            style={{
                              padding: "12px 14px",
                              borderRadius: 16,
                              border: isCurrent ? "1px solid #0f172a" : "1px solid #cbd5e1",
                              background: isCurrent ? "#0f172a" : "#fff",
                              color: isCurrent ? "#fff" : "#334155",
                              minWidth: 112,
                            }}
                          >
                            <div style={{ fontSize: 12, opacity: isCurrent ? 0.82 : 0.7, marginBottom: 4 }}>
                              {stage.value}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{stage.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div style={statusHintBlockStyle}>
                  <div style={sectionLabelStyle}>Next Step</div>
                  <div style={hintStackStyle}>
                    <div style={operatorHintStyle(selectedReadiness.overall ? "success" : "warn")}>
                      {workspaceNextStepMessage}
                    </div>
                  </div>
                </div>

                {selectedIsArchived ? (
                  <div style={archivedBannerStyle}>
                    This doll is archived. Its digital identity and related records are preserved, but it is no longer
                    part of the active lifecycle.
                  </div>
                ) : null}

                <div style={{ marginTop: 8, height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                  <div style={{ width: `${progressFromStatus(effectiveLifecycleStatus)}%`, height: "100%", background: "#0f172a", borderRadius: 999 }} />
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ ...sectionLabelStyle, marginBottom: 10 }}>Departments</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {DEPARTMENTS.map((department) => (
                      <button
                        key={department}
                        onClick={() => setActiveDepartment(department)}
                        style={{
                          padding: "12px 18px",
                          borderRadius: 16,
                          border: currentDepartment === department ? "1px solid #0f172a" : "1px solid #cbd5e1",
                          background: currentDepartment === department ? "#0f172a" : "#fff",
                          color: currentDepartment === department ? "#fff" : "#0f172a",
                          cursor: "pointer",
                          fontSize: 15,
                        }}
                      >
                        {department}
                      </button>
                    ))}
                  </div>
                </div>

                {currentDepartment === "Overview" ? (
                  <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {[
                        { label: "Commerce", value: formatStatusToken(effectiveCommercialStatus), tone: "neutral" },
                        {
                          label: "Access",
                          value: formatStatusToken(effectiveAccessStatus),
                          tone: effectiveAccessStatus === "generated" ? "success" : "warn",
                        },
                        {
                          label: "Readiness",
                          value: readinessStatusLabel,
                          tone: selectedReadiness.overall ? "success" : "warn",
                        },
                      ].map((item) => (
                        <div key={item.label} style={statusPillStyle(item.tone)}>
                          <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75, fontWeight: 700 }}>
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
                          Production is complete. This doll is ready for commerce.
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

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Next Recommended Action</div>
                      <div style={operatorHintStyle(selectedReadiness.overall ? "success" : "muted")}>
                        {overviewNextActionMessage}
                      </div>
                    </div>
                  </div>
                ) : currentDepartment === "Production" ? (
                  productionDepartmentContent
                ) : currentDepartment === "Character" ? (
                  characterDepartmentContent
                ) : currentDepartment === "Content" ? (
                  contentDepartmentContent
                ) : currentDepartment === "Digital" ? (
                  digitalDepartmentContent
                ) : currentDepartment === "Commerce" ? (
                  commerceDepartmentContent
                ) : currentDepartment === "Danger Zone" ? (
                  dangerZoneDepartmentContent
                ) : (
                  null
                )}
              </>
            ) : (
              <div style={{ color: "#64748b" }}>Create your first doll to begin.</div>
            )}
          </section>
        </div>

        <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
          {notice ? (
            <div style={{ background: "#dff5e7", border: "1px solid #9fe0b4", color: "#166534", padding: 16, borderRadius: 16 }}>
              {notice}
            </div>
          ) : null}

          {error ? (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: 16, borderRadius: 16 }}>
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </main>
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

const archivedBannerStyle = {
  marginTop: 12,
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: 14,
  color: "#475569",
  lineHeight: 1.7,
  fontSize: 14,
};

const statusHintBlockStyle = {
  marginTop: 16,
};

const hintStackStyle = {
  display: "grid",
  gap: 10,
};

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
