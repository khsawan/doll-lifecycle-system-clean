import { createSuccessResult } from "../../shared/contracts/index.js";
import { AI_TASKS } from "./taskRouting.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function stripCodeFences(value) {
  return String(value || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseJsonResponse(responseText) {
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

function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeVariationId(value, index) {
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
    id: normalizeVariationId(value?.id, index),
    label: readOptionalString(value?.label) || `Version ${index + 1}`,
    story_main: storyMain,
  };
}

function normalizeStoryResult(parsed) {
  const variations = Array.isArray(parsed?.variations)
    ? parsed.variations
        .slice(0, 3)
        .map((variation, index) => normalizeStoryVariation(variation, index))
        .filter(Boolean)
    : [];

  if (variations.length) {
    return {
      story_main: variations[0].story_main,
      variations,
    };
  }

  const legacyStoryMain = readOptionalString(parsed?.story_main);

  if (!legacyStoryMain) {
    throw new Error("AI response JSON did not include any valid story variations.");
  }

  return {
    story_main: legacyStoryMain,
    variations: [
      {
        id: "v1",
        label: "Version 1",
        story_main: legacyStoryMain,
      },
    ],
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
    id: normalizeVariationId(value?.id, index),
    label: readOptionalString(value?.label) || `Version ${index + 1}`,
    short_intro: shortIntro,
    content_blurb: contentBlurb,
    promo_hook: promoHook,
    cta,
  };
}

function normalizeContentPackResult(parsed) {
  const variations = Array.isArray(parsed?.variations)
    ? parsed.variations
        .slice(0, 3)
        .map((variation, index) => normalizeContentPackVariation(variation, index))
        .filter(Boolean)
    : [];

  if (!variations.length) {
    const shortIntro = readOptionalString(parsed?.short_intro);
    const contentBlurb = readOptionalString(parsed?.content_blurb);
    const promoHook = readOptionalString(parsed?.promo_hook);
    const cta = readOptionalString(parsed?.cta);

    if (shortIntro && contentBlurb && promoHook && cta) {
      variations.push({
        id: "v1",
        label: "Version 1",
        short_intro: shortIntro,
        content_blurb: contentBlurb,
        promo_hook: promoHook,
        cta,
      });
    }
  }

  if (!variations.length) {
    throw new Error("AI response JSON did not include any valid content pack variations.");
  }

  return {
    variations,
    short_intro: variations[0].short_intro,
    content_blurb: variations[0].content_blurb,
    promo_hook: variations[0].promo_hook,
    cta: variations[0].cta,
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
    id: normalizeVariationId(value?.id, index),
    label: readOptionalString(value?.label) || `Version ${index + 1}`,
    social_hook: socialHook,
    social_caption: socialCaption,
    social_cta: socialCta,
  };
}

function normalizeSocialResult(parsed) {
  const variations = Array.isArray(parsed?.variations)
    ? parsed.variations
        .slice(0, 3)
        .map((variation, index) => normalizeSocialVariation(variation, index))
        .filter(Boolean)
    : [];

  if (!variations.length) {
    const socialHook = readOptionalString(parsed?.social_hook);
    const socialCaption = readOptionalString(parsed?.social_caption);
    const socialCta = readOptionalString(parsed?.social_cta);

    if (socialHook && socialCaption && socialCta) {
      variations.push({
        id: "v1",
        label: "Version 1",
        social_hook: socialHook,
        social_caption: socialCaption,
        social_cta: socialCta,
      });
    }
  }

  if (!variations.length) {
    throw new Error("AI response JSON did not include any valid social variations.");
  }

  return {
    variations,
    social_hook: variations[0].social_hook,
    social_caption: variations[0].social_caption,
    social_cta: variations[0].social_cta,
  };
}

function normalizeV1Choice(value, index) {
  return {
    id: readOptionalString(value?.id) || `choice_${index + 1}`,
    label: readOptionalString(value?.label),
    result_text: readOptionalString(value?.result_text),
  };
}

export function normalizeV1ContentResponse(responseText) {
  const parsed = parseJsonResponse(responseText);
  const storyPages = Array.isArray(parsed?.story_pages)
    ? parsed.story_pages.slice(0, 4).map((page) => readOptionalString(page))
    : [];
  const choices = Array.isArray(parsed?.play_activity?.choices)
    ? parsed.play_activity.choices
        .slice(0, 3)
        .map((choice, index) => normalizeV1Choice(choice, index))
    : [];

  while (storyPages.length < 4) {
    storyPages.push("");
  }

  while (choices.length < 3) {
    choices.push(normalizeV1Choice({}, choices.length));
  }

  return {
    intro_script: readOptionalString(parsed?.intro_script),
    story_pages: storyPages,
    play_activity: {
      prompt: readOptionalString(parsed?.play_activity?.prompt),
      choices,
    },
  };
}

function normalizeCharacterBriefResult(parsed) {
  return {
    emotional_spark: readOptionalString(parsed?.emotional_spark),
    emotional_essence: readOptionalString(parsed?.emotional_essence),
    temperament: readOptionalString(parsed?.temperament),
    emotional_role: readOptionalString(parsed?.emotional_role),
    small_tenderness: readOptionalString(parsed?.small_tenderness),
    signature_trait: readOptionalString(parsed?.signature_trait),
    sample_voice_line: readOptionalString(parsed?.sample_voice_line),
  };
}

export function normalizeAIResponse({ provider, task, responseText }) {
  const parsed = parseJsonResponse(responseText);

  if (task === AI_TASKS.CHARACTER_BRIEF) {
    return {
      ok: true,
      task: AI_TASKS.CHARACTER_BRIEF,
      provider,
      result: normalizeCharacterBriefResult(parsed),
    };
  }

  if (task === AI_TASKS.STORY) {
    return {
      ok: true,
      task: AI_TASKS.STORY,
      provider,
      result: normalizeStoryResult(parsed),
    };
  }

  if (task === AI_TASKS.CONTENT_PACK) {
    return {
      ok: true,
      task: AI_TASKS.CONTENT_PACK,
      provider,
      result: normalizeContentPackResult(parsed),
    };
  }

  if (task === AI_TASKS.SOCIAL) {
    return {
      ok: true,
      task: AI_TASKS.SOCIAL,
      provider,
      result: normalizeSocialResult(parsed),
    };
  }

  throw new Error(`Unsupported normalization task: ${task}`);
}

export function createAIGenerationResult({
  task,
  provider,
  result,
  code = "AI_GENERATION_COMPLETED",
  message = "AI generation completed.",
  warnings = [],
}) {
  const data = {
    task,
    provider,
    result,
  };
  const success = createSuccessResult({
    code,
    message,
    data,
    warnings,
  });

  return isPlainObject(data)
    ? {
        ...success,
        ...data,
      }
    : success;
}

export function normalizeAIExecutionResult({ provider, task, responseText }) {
  if (task === AI_TASKS.V1_CONTENT) {
    return createAIGenerationResult({
      task: AI_TASKS.V1_CONTENT,
      provider,
      result: normalizeV1ContentResponse(responseText),
      code: "AI_V1_CONTENT_GENERATED",
      message: "AI managed content generated.",
    });
  }

  const normalized = normalizeAIResponse({
    provider,
    task,
    responseText,
  });

  return createAIGenerationResult({
    task: normalized.task || task,
    provider: normalized.provider || provider,
    result: normalized.result || {},
    code: "AI_GENERATION_COMPLETED",
    message: "AI content generated.",
  });
}
