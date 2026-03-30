import {
  COMMERCE_STATUSES,
  CONTENT_GENERATION_STATUSES,
  CONTENT_PUBLISH_STATUSES,
  CONTENT_REVIEW_STATUSES,
  DEFAULT_CONTENT_MANAGEMENT_STATE,
  V1_PLAY_ACTIVITY_CHOICE_IDS,
} from "../constants/content";

export function normalizeCommerceStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return COMMERCE_STATUSES.includes(normalized) ? normalized : "draft";
}

export function normalizeContentGenerationStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return CONTENT_GENERATION_STATUSES.includes(normalized)
    ? normalized
    : DEFAULT_CONTENT_MANAGEMENT_STATE.generation_status;
}

export function normalizeContentReviewStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return CONTENT_REVIEW_STATUSES.includes(normalized)
    ? normalized
    : DEFAULT_CONTENT_MANAGEMENT_STATE.review_status;
}

export function normalizeContentPublishStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return CONTENT_PUBLISH_STATUSES.includes(normalized)
    ? normalized
    : DEFAULT_CONTENT_MANAGEMENT_STATE.publish_status;
}

export function buildLocalContentManagementState(record = {}) {
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

export function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function cleanList(value) {
  return (value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function emptyStoryState() {
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

export function readStoryVariationCandidates(result) {
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

export function readContentPackVariationCandidates(result) {
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

export function readSocialVariationCandidates(result) {
  if (!Array.isArray(result?.variations)) {
    return [];
  }

  return result.variations
    .slice(0, 3)
    .map((variation, index) => normalizeSocialVariationCandidate(variation, index))
    .filter(Boolean);
}

export function emptyContentPackState() {
  return {
    caption: "",
    hook: "",
    blurb: "",
    cta: "",
  };
}

export function emptyOrderState() {
  return {
    customer_name: "",
    contact_info: "",
    notes: "",
    order_status: "new",
  };
}

export function emptyPlayActivityState() {
  return {
    prompt: "",
    choices: [],
  };
}

export function emptyV1GeneratedContentState() {
  return {
    intro_script: "",
    story_pages: ["", "", "", ""],
    play_activity: emptyPlayActivityState(),
  };
}

export function buildEditablePlayActivityState(value = {}) {
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

export function emptyGeneratedContentEditorState() {
  return {
    intro_script: false,
    story_pages: [false, false, false, false],
    play_activity: false,
  };
}

export function hasPlayActivityChoiceContent(choices = []) {
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

export function buildLocalV1GeneratedContentState(value = {}) {
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

export function hasV1GeneratedContent(value = {}) {
  const normalized = buildLocalV1GeneratedContentState(value);

  return Boolean(
    normalized.intro_script.trim() ||
      normalized.story_pages.some((page) => page.trim()) ||
      normalized.play_activity.prompt.trim() ||
      hasPlayActivityChoiceContent(normalized.play_activity.choices)
  );
}

export function buildStorySectionSnapshot(value = {}) {
  return {
    teaser: value.teaser || "",
    mainStory: value.mainStory || "",
    mini1: value.mini1 || "",
    mini2: value.mini2 || "",
  };
}

export function buildStoryStateFromVariation(previousStory = {}, variation = {}, nextPack = null) {
  const baseStory = buildStorySectionSnapshot(previousStory);
  const storyMain = typeof variation?.story_main === "string" ? variation.story_main.trim() : "";

  if (!storyMain) {
    return baseStory;
  }

  return {
    teaser: nextPack?.teaser ?? baseStory.teaser,
    mainStory: storyMain,
    mini1: nextPack?.mini1 ?? baseStory.mini1,
    mini2: nextPack?.mini2 ?? baseStory.mini2,
  };
}

export function buildContentPackSectionSnapshot(value = {}) {
  return {
    caption: value.caption || "",
    hook: value.hook || "",
    blurb: value.blurb || "",
    cta: value.cta || "",
  };
}

export function buildContentPackStateFromVariation(variation = {}, previousContentPack = {}) {
  const baseContentPack = buildContentPackSectionSnapshot(previousContentPack);
  const shortIntro =
    typeof variation?.short_intro === "string" ? variation.short_intro.trim() : "";
  const promoHook =
    typeof variation?.promo_hook === "string" ? variation.promo_hook.trim() : "";
  const contentBlurb =
    typeof variation?.content_blurb === "string" ? variation.content_blurb.trim() : "";
  const cta = typeof variation?.cta === "string" ? variation.cta.trim() : "";

  if (!shortIntro || !promoHook || !contentBlurb || !cta) {
    return baseContentPack;
  }

  return {
    caption: shortIntro,
    hook: promoHook,
    blurb: contentBlurb,
    cta,
  };
}

export function buildSocialSectionSnapshot(value = {}) {
  return {
    social_hook: value.social_hook || "",
    social_caption: value.social_caption || "",
    social_cta: value.social_cta || "",
    social_status: value.social_status || "draft",
  };
}

export function buildIdentityStateFromSocialVariation(previousIdentity = {}, variation = {}) {
  const socialHook =
    typeof variation?.social_hook === "string" ? variation.social_hook.trim() : "";
  const socialCaption =
    typeof variation?.social_caption === "string" ? variation.social_caption.trim() : "";
  const socialCta =
    typeof variation?.social_cta === "string" ? variation.social_cta.trim() : "";

  if (!socialHook || !socialCaption || !socialCta) {
    return { ...previousIdentity };
  }

  return {
    ...previousIdentity,
    social_hook: socialHook,
    social_caption: socialCaption,
    social_cta: socialCta,
  };
}

export function sectionStateSignature(value) {
  return JSON.stringify(value);
}

export function buildSectionSaveState({
  currentSnapshot = {},
  savedSnapshot = null,
  isSaving = false,
  defaultLabel = "Save",
} = {}) {
  const hasSavedSnapshot = savedSnapshot !== null;
  const currentSignature = sectionStateSignature(currentSnapshot);
  const savedSignature = hasSavedSnapshot ? sectionStateSignature(savedSnapshot) : null;
  const dirty = !hasSavedSnapshot || currentSignature !== savedSignature;

  return {
    dirty,
    saving: Boolean(isSaving),
    hasSavedSnapshot,
    disabled: Boolean(isSaving || (!dirty && hasSavedSnapshot)),
    label: isSaving ? "Saving..." : !dirty && hasSavedSnapshot ? "Saved" : defaultLabel,
  };
}

export function buildContentEditorSaveStates({
  story = {},
  savedStorySnapshot = null,
  storySaving = false,
  contentPack = {},
  savedContentPackSnapshot = null,
  contentPackSaving = false,
  identity = {},
  savedSocialSnapshot = null,
  socialSaving = false,
} = {}) {
  return {
    storySaveState: buildSectionSaveState({
      currentSnapshot: buildStorySectionSnapshot(story),
      savedSnapshot: savedStorySnapshot,
      isSaving: storySaving,
      defaultLabel: "Save Story",
    }),
    contentPackSaveState: buildSectionSaveState({
      currentSnapshot: buildContentPackSectionSnapshot(contentPack),
      savedSnapshot: savedContentPackSnapshot,
      isSaving: contentPackSaving,
      defaultLabel: "Save Content Pack",
    }),
    socialSaveState: buildSectionSaveState({
      currentSnapshot: buildSocialSectionSnapshot(identity),
      savedSnapshot: savedSocialSnapshot,
      isSaving: socialSaving,
      defaultLabel: "Save Social Content",
    }),
  };
}

export function buildAdminContentSectionState({
  isContentEditable,
  hasStoryContent,
  storyTone,
  setStoryTone,
  applyTone,
  storyGenerating,
  saveStory,
  storyVariations,
  selectedStoryVariationId,
  applyStoryVariationToEditor,
  story,
  setStory,
  setSelectedStoryVariationId,
  savedStorySnapshot,
  storySaving,
  hasContentAssets,
  generateContentPack,
  contentPackGenerating,
  contentPackSaving,
  saveContentPack,
  contentPackVariations,
  selectedContentPackVariationId,
  applyContentPackVariationToEditor,
  contentPack,
  setContentPack,
  setSelectedContentPackVariationId,
  savedContentPackSnapshot,
  generateSocialContent,
  socialGenerating,
  saveIdentity,
  socialVariations,
  selectedSocialVariationId,
  applySocialVariationToEditor,
  identity,
  setIdentity,
  setSelectedSocialVariationId,
  savedSocialSnapshot,
  socialSaving,
} = {}) {
  const { storySaveState, contentPackSaveState, socialSaveState } =
    buildContentEditorSaveStates({
      story,
      savedStorySnapshot,
      storySaving,
      contentPack,
      savedContentPackSnapshot,
      contentPackSaving,
      identity,
      savedSocialSnapshot,
      socialSaving,
    });

  return {
    isContentEditable: Boolean(isContentEditable),
    hasStoryContent: Boolean(hasStoryContent),
    storyTone: storyTone || "Gentle",
    setStoryTone,
    applyTone,
    storyGenerating: Boolean(storyGenerating),
    saveStory,
    storySaveState,
    storyVariations: Array.isArray(storyVariations) ? storyVariations : [],
    selectedStoryVariationId: selectedStoryVariationId || null,
    applyStoryVariationToEditor,
    story,
    setStory,
    setSelectedStoryVariationId,
    hasContentAssets: Boolean(hasContentAssets),
    generateContentPack,
    contentPackGenerating: Boolean(contentPackGenerating),
    saveContentPack,
    contentPackSaveState,
    contentPackVariations: Array.isArray(contentPackVariations)
      ? contentPackVariations
      : [],
    selectedContentPackVariationId: selectedContentPackVariationId || null,
    applyContentPackVariationToEditor,
    contentPack,
    setContentPack,
    setSelectedContentPackVariationId,
    generateSocialContent,
    socialGenerating: Boolean(socialGenerating),
    saveIdentity,
    socialSaveState,
    socialVariations: Array.isArray(socialVariations) ? socialVariations : [],
    selectedSocialVariationId: selectedSocialVariationId || null,
    applySocialVariationToEditor,
    identity,
    setIdentity,
    setSelectedVariationId: setSelectedSocialVariationId,
    setSelectedSocialVariationId,
  };
}

export function extractDollAssetPath(url) {
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

export function buildStoryPack(doll, tone) {
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

export function buildContentPack(doll, storyData, publicBaseUrl) {
  const name = doll.name || "This doll";
  const theme = doll.theme_name || "Unassigned";
  const hook = doll.emotional_hook || `${name} brings warmth and wonder wherever she goes`;
  const intro = doll.short_intro || `${name} is a one-of-a-kind handmade doll with a story.`;
  const teaser = storyData.teaser || `Meet ${name}, a one-of-a-kind doll with a gentle story to tell.`;
  const publicSlug =
    typeof doll.slug === "string" && doll.slug.trim() ? doll.slug.trim() : slugify(name);
  const publicDollUrl = publicBaseUrl ? `${publicBaseUrl}/doll/${publicSlug}` : "";

  return {
    caption: `${name} âœ¨

${intro}

${teaser}

Discover ${name}'s world: ${publicDollUrl}

#MailleEtMerveille #DollWithAStory #HandmadeDoll`,
    hook: `Meet ${name}, a one-of-a-kind doll from the ${theme} world.`,
    blurb: `${name} is a handmade doll created to bring story, warmth, and imagination into everyday moments. ${hook}`,
    cta: `Discover ${name}'s world`,
  };
}

export function generateV1ContentFromIdentity(doll = {}) {
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

export function mergeV1GeneratedContentWithFallback(value = {}, fallback = {}) {
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
