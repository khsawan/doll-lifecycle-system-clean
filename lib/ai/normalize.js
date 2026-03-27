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
      result: {
        short_intro: readRequiredString(parsed, "short_intro"),
        content_blurb: readRequiredString(parsed, "content_blurb"),
        promo_hook: readRequiredString(parsed, "promo_hook"),
        cta: readRequiredString(parsed, "cta"),
      },
    };
  }

  if (task === "social") {
    return {
      ok: true,
      task: "social",
      provider,
      result: {
        social_hook: readRequiredString(parsed, "social_hook"),
        social_caption: readRequiredString(parsed, "social_caption"),
        social_cta: readRequiredString(parsed, "social_cta"),
      },
    };
  }

  throw new Error(`Unsupported normalization task: ${task}`);
}
