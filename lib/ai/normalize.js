function stripCodeFences(value) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonResponse(responseText) {
  const cleaned = stripCodeFences(responseText);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("AI provider did not return valid JSON.");
  }
}

function readRequiredString(parsed, key) {
  const value = typeof parsed?.[key] === "string" ? parsed[key].trim() : "";

  if (!value) {
    throw new Error(`AI response JSON is missing ${key}.`);
  }

  return value;
}

function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStoryVariationId(value, index) {
  const normalized = readOptionalString(value).toLowerCase();

  if (/^[a-z0-9_-]+$/.test(normalized)) {
    return normalized;
  }

  return `v${index + 1}`;
}

function normalizeStoryVariation(value, index) {
  const storyMain =
    readOptionalString(value?.story_main) ||
    readOptionalString(value?.task?.story_main);

  if (!storyMain) {
    return null;
  }

  return {
    id: normalizeStoryVariationId(value?.id, index),
    label: readOptionalString(value?.label) || `Version ${index + 1}`,
    story_main: storyMain,
  };
}

function normalizeStoryResult(parsed) {
  const normalizedVariations = Array.isArray(parsed?.variations)
    ? parsed.variations
        .slice(0, 3)
        .map((variation, index) => normalizeStoryVariation(variation, index))
        .filter(Boolean)
    : [];

  if (!normalizedVariations.length) {
    const legacyStoryMain = readOptionalString(parsed?.story_main);

    if (legacyStoryMain) {
      normalizedVariations.push({
        id: "v1",
        label: "Version 1",
        story_main: legacyStoryMain,
      });
    }
  }

  if (!normalizedVariations.length) {
    throw new Error("AI response JSON did not include any valid story variations.");
  }

  return {
    variations: normalizedVariations,
    // Preserve the current story admin caller until D1 selection UI lands.
    story_main: normalizedVariations[0].story_main,
  };
}

function normalizeContentPackVariation(value, index) {
  const shortIntro =
    readOptionalString(value?.short_intro) ||
    readOptionalString(value?.task?.short_intro);
  const contentBlurb =
    readOptionalString(value?.content_blurb) ||
    readOptionalString(value?.task?.content_blurb);
  const promoHook =
    readOptionalString(value?.promo_hook) ||
    readOptionalString(value?.task?.promo_hook);
  const cta = readOptionalString(value?.cta) || readOptionalString(value?.task?.cta);

  if (!shortIntro || !contentBlurb || !promoHook || !cta) {
    return null;
  }

  return {
    id: normalizeStoryVariationId(value?.id, index),
    label: readOptionalString(value?.label) || `Version ${index + 1}`,
    short_intro: shortIntro,
    content_blurb: contentBlurb,
    promo_hook: promoHook,
    cta,
  };
}

function normalizeContentPackResult(parsed) {
  const normalizedVariations = Array.isArray(parsed?.variations)
    ? parsed.variations
        .slice(0, 3)
        .map((variation, index) => normalizeContentPackVariation(variation, index))
        .filter(Boolean)
    : [];

  if (!normalizedVariations.length) {
    const shortIntro = readOptionalString(parsed?.short_intro);
    const contentBlurb = readOptionalString(parsed?.content_blurb);
    const promoHook = readOptionalString(parsed?.promo_hook);
    const cta = readOptionalString(parsed?.cta);

    if (shortIntro && contentBlurb && promoHook && cta) {
      normalizedVariations.push({
        id: "v1",
        label: "Version 1",
        short_intro: shortIntro,
        content_blurb: contentBlurb,
        promo_hook: promoHook,
        cta,
      });
    }
  }

  if (!normalizedVariations.length) {
    throw new Error("AI response JSON did not include any valid content pack variations.");
  }

  return {
    variations: normalizedVariations,
    // Preserve the current content pack admin caller until D1 selection UI lands.
    short_intro: normalizedVariations[0].short_intro,
    content_blurb: normalizedVariations[0].content_blurb,
    promo_hook: normalizedVariations[0].promo_hook,
    cta: normalizedVariations[0].cta,
  };
}

function normalizeSocialVariation(value, index) {
  const socialHook =
    readOptionalString(value?.social_hook) ||
    readOptionalString(value?.task?.social_hook);
  const socialCaption =
    readOptionalString(value?.social_caption) ||
    readOptionalString(value?.task?.social_caption);
  const socialCta =
    readOptionalString(value?.social_cta) ||
    readOptionalString(value?.task?.social_cta);

  if (!socialHook || !socialCaption || !socialCta) {
    return null;
  }

  return {
    id: normalizeStoryVariationId(value?.id, index),
    label: readOptionalString(value?.label) || `Version ${index + 1}`,
    social_hook: socialHook,
    social_caption: socialCaption,
    social_cta: socialCta,
  };
}

function normalizeSocialResult(parsed) {
  const normalizedVariations = Array.isArray(parsed?.variations)
    ? parsed.variations
        .slice(0, 3)
        .map((variation, index) => normalizeSocialVariation(variation, index))
        .filter(Boolean)
    : [];

  if (!normalizedVariations.length) {
    const socialHook = readOptionalString(parsed?.social_hook);
    const socialCaption = readOptionalString(parsed?.social_caption);
    const socialCta = readOptionalString(parsed?.social_cta);

    if (socialHook && socialCaption && socialCta) {
      normalizedVariations.push({
        id: "v1",
        label: "Version 1",
        social_hook: socialHook,
        social_caption: socialCaption,
        social_cta: socialCta,
      });
    }
  }

  if (!normalizedVariations.length) {
    throw new Error("AI response JSON did not include any valid social variations.");
  }

  return {
    variations: normalizedVariations,
    // Preserve the current social admin caller until D1 selection UI lands.
    social_hook: normalizedVariations[0].social_hook,
    social_caption: normalizedVariations[0].social_caption,
    social_cta: normalizedVariations[0].social_cta,
  };
}

export function normalizeAIResponse({ provider, task, responseText }) {
  const parsed = parseJsonResponse(responseText);

  if (task === "story") {
    return {
      ok: true,
      task: "story",
      provider,
      result: normalizeStoryResult(parsed),
    };
  }

  if (task === "content_pack") {
    return {
      ok: true,
      task: "content_pack",
      provider,
      result: normalizeContentPackResult(parsed),
    };
  }

  if (task === "social") {
    return {
      ok: true,
      task: "social",
      provider,
      result: normalizeSocialResult(parsed),
    };
  }

  throw new Error(`Unsupported normalization task: ${task}`);
}
