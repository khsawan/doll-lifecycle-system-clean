import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeAIResponse } from "./normalize";
import { buildContentPackPrompt } from "./prompts/contentPack";
import { buildSocialPrompt } from "./prompts/social";
import { buildStoryPrompt } from "./prompts/story";
import { buildV1ContentPrompt } from "./prompts/v1Content";
import { generateWithAnthropic } from "./providers/anthropic";

const AI_SETTING_KEYS = ["ai_provider", "ai_model"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function normalizeProvider(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function stripCodeFences(value) {
  return String(value || "")
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

function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeV1Choice(value, index) {
  return {
    id: readOptionalString(value?.id) || `choice_${index + 1}`,
    label: readOptionalString(value?.label),
    result_text: readOptionalString(value?.result_text),
  };
}

function normalizeV1ContentResponse(responseText) {
  const parsed = parseJsonResponse(responseText);
  const storyPages = Array.isArray(parsed?.story_pages)
    ? parsed.story_pages.slice(0, 4).map((page) => readOptionalString(page))
    : [];
  const choices = Array.isArray(parsed?.play_activity?.choices)
    ? parsed.play_activity.choices.slice(0, 3).map((choice, index) => normalizeV1Choice(choice, index))
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

async function loadAISettings() {
  if (!supabaseUrl || !supabaseKey) {
    return {};
  }

  try {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from("app_settings")
      .select("key, value")
      .in("key", AI_SETTING_KEYS);

    if (error) {
      console.warn(`Unable to load AI settings. ${error.message}`);
      return {};
    }

    return (data || []).reduce((acc, row) => {
      if (!AI_SETTING_KEYS.includes(row.key)) return acc;
      acc[row.key] = typeof row.value === "string" ? row.value.trim() : "";
      return acc;
    }, {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`Unable to load AI settings. ${message}`);
    return {};
  }
}

export async function generateAIContent({ provider, task, payload }) {
  const aiSettings = await loadAISettings();
  const resolvedProvider =
    normalizeProvider(provider) ||
    normalizeProvider(aiSettings.ai_provider) ||
    "anthropic";
  const resolvedModel =
    typeof aiSettings.ai_model === "string" && aiSettings.ai_model.trim()
      ? aiSettings.ai_model.trim()
      : "";
  let prompt = "";

  switch (task) {
    case "story":
      prompt = buildStoryPrompt(payload || {});
      break;
    case "content_pack":
      prompt = buildContentPackPrompt(payload || {});
      break;
    case "social":
      prompt = buildSocialPrompt(payload || {});
      break;
    case "v1_content":
      prompt = buildV1ContentPrompt(payload || {});
      break;
    default:
      throw new Error(`Unsupported AI task: ${task}`);
  }

  let responseText = "";

  switch (resolvedProvider) {
    case "anthropic":
      responseText = await generateWithAnthropic({
        prompt,
        task,
        model: resolvedModel,
      });
      break;
    default:
      throw new Error(`Unsupported AI provider: ${resolvedProvider}`);
  }

  if (task === "v1_content") {
    return {
      ok: true,
      task: "v1_content",
      provider: resolvedProvider,
      result: normalizeV1ContentResponse(responseText),
    };
  }

  return normalizeAIResponse({
    provider: resolvedProvider,
    task,
    responseText,
  });
}
