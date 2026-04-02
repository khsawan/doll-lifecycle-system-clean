import {
  buildContentPackSectionSnapshot,
  buildLocalV1GeneratedContentState,
  buildSocialSectionSnapshot,
  buildStorySectionSnapshot,
  emptyOrderState,
  emptyPlayActivityState,
  hasV1GeneratedContent,
  normalizeCommerceStatus,
} from "./content";

export function resolveActiveGeneratedV1Content(doll, localGeneratedContent) {
  const localGeneratedV1Content = localGeneratedContent
    ? buildLocalV1GeneratedContentState(localGeneratedContent)
    : null;
  const persistedGeneratedV1Content =
    doll && hasV1GeneratedContent(doll)
      ? buildLocalV1GeneratedContentState({
          intro_script: doll.intro_script,
          story_pages: doll.story_pages,
          play_activity: doll.play_activity,
        })
      : null;

  return localGeneratedV1Content || persistedGeneratedV1Content;
}

export function buildIdentityEditorState(doll, activeGeneratedV1Content) {
  if (!doll) {
    return {
      commerceStatus: "draft",
      identity: null,
      savedSocialSnapshot: null,
      qrDataUrl: "",
    };
  }

  const identity = {
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
    emotional_spark: doll.emotional_spark || "",
    emotional_essence: doll.emotional_essence || "",
    temperament: doll.temperament || "",
    emotional_role: doll.emotional_role || "",
    small_tenderness: doll.small_tenderness || "",
    signature_trait: doll.signature_trait || "",
    sample_voice_line: doll.sample_voice_line || "",
  };

  const hasSavedSocialSnapshot = Boolean(
    doll.social_hook?.trim() ||
      doll.social_caption?.trim() ||
      doll.social_cta?.trim() ||
      (typeof doll.social_status === "string" && doll.social_status.trim())
  );

  return {
    commerceStatus: normalizeCommerceStatus(doll.commerce_status),
    identity,
    savedSocialSnapshot: hasSavedSocialSnapshot
      ? buildSocialSectionSnapshot(identity)
      : null,
    qrDataUrl: doll.qr_code_url || "",
  };
}

export function buildStoryEditorState(stories = [], activeGeneratedV1Content) {
  function readText(storyType) {
    const row = stories.find((s) => s.story_type === storyType);
    if (!row) return "";
    // content is JSONB { text: "..." }
    return typeof row.content?.text === "string" ? row.content.text : "";
  }

  const persistedStory = {
    teaser:    readText("teaser"),
    mainStory: readText("main"),
    mini1:     readText("mini_1"),
    mini2:     readText("mini_2"),
  };

  return {
    story: {
      teaser: activeGeneratedV1Content?.story_pages?.[0] || persistedStory.teaser,
      mainStory: activeGeneratedV1Content?.story_pages?.[1] || persistedStory.mainStory,
      mini1: activeGeneratedV1Content?.story_pages?.[2] || persistedStory.mini1,
      mini2: activeGeneratedV1Content?.story_pages?.[3] || persistedStory.mini2,
    },
    savedStorySnapshot: stories.length ? buildStorySectionSnapshot(persistedStory) : null,
  };
}

export function buildContentPackEditorState(contentRows = []) {
  const contentPack = {
    caption: contentRows.find((row) => row.type === "instagram_caption")?.content || "",
    hook: contentRows.find((row) => row.type === "promo_hook")?.content || "",
    blurb: contentRows.find((row) => row.type === "product_blurb")?.content || "",
    cta: contentRows.find((row) => row.type === "cta")?.content || "",
  };

  const hasSavedContentPack = contentRows.some((row) =>
    ["instagram_caption", "promo_hook", "product_blurb", "cta"].includes(row.type)
  );

  return {
    contentPack,
    savedContentPackSnapshot: hasSavedContentPack
      ? buildContentPackSectionSnapshot(contentPack)
      : null,
  };
}

export function buildOrderEditorState(orders = []) {
  if (orders.length > 0) {
    return {
      order: {
        customer_name: orders[0].customer_name || "",
        contact_info: orders[0].contact_info || "",
        notes: orders[0].notes || "",
        order_status: orders[0].order_status || "new",
      },
    };
  }

  return {
    order: emptyOrderState(),
  };
}

export function buildPlayActivityEditorState(activeGeneratedV1Content) {
  return {
    playActivity: activeGeneratedV1Content?.play_activity
      ? activeGeneratedV1Content.play_activity
      : emptyPlayActivityState(),
  };
}

export function buildAdminDollDetailState({
  doll,
  localGeneratedContent,
  stories = [],
  contentRows = [],
  orders = [],
}) {
  const activeGeneratedV1Content = resolveActiveGeneratedV1Content(
    doll,
    localGeneratedContent
  );

  return {
    ...buildIdentityEditorState(doll, activeGeneratedV1Content),
    ...buildStoryEditorState(stories, activeGeneratedV1Content),
    ...buildContentPackEditorState(contentRows),
    ...buildOrderEditorState(orders),
    ...buildPlayActivityEditorState(activeGeneratedV1Content),
  };
}
