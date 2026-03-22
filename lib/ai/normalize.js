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

export function normalizeAIResponse({ provider, task, responseText }) {
  const parsed = parseJsonResponse(responseText);

  if (task === "story") {
    return {
      ok: true,
      task: "story",
      provider,
      result: {
        story_main: readRequiredString(parsed, "story_main"),
      },
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
