import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeAIResponse } from "./normalize";
import { buildContentPackPrompt } from "./prompts/contentPack";
import { buildSocialPrompt } from "./prompts/social";
import { buildStoryPrompt } from "./prompts/story";
import { generateWithAnthropic } from "./providers/anthropic";

const AI_SETTING_KEYS = ["ai_provider", "ai_model"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function normalizeProvider(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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

  return normalizeAIResponse({
    provider: resolvedProvider,
    task,
    responseText,
  });
}
