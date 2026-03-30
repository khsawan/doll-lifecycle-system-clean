import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-flash-latest";
const LEGACY_GOOGLE_MODEL_ALIASES = Object.freeze({
  "gemini-1.5-flash": DEFAULT_MODEL,
  "gemini-1.5-flash-latest": DEFAULT_MODEL,
});

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function resolveGoogleModel(model) {
  const normalizedModel = readOptionalString(model).replace(/^models\//i, "");

  if (!normalizedModel) {
    return DEFAULT_MODEL;
  }

  const legacyAlias = LEGACY_GOOGLE_MODEL_ALIASES[normalizedModel.toLowerCase()];

  if (legacyAlias) {
    return legacyAlias;
  }

  return normalizedModel.toLowerCase().startsWith("gemini")
    ? normalizedModel
    : DEFAULT_MODEL;
}

export async function generateWithGoogle({
  prompt: _prompt,
  task: _task = "story",
  model = "",
}) {
  const apiKey = readOptionalString(process.env.GOOGLE_AI_API_KEY);
  const resolvedModel = resolveGoogleModel(model);

  if (!apiKey || apiKey.length < 10) {
    throw new Error("GOOGLE_AI_API_KEY missing or invalid");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const generativeModel = client.getGenerativeModel({
    model: resolvedModel,
  });
  const result = await generativeModel.generateContent(_prompt);
  const response = await result.response;
  const text = typeof response?.text === "function" ? response.text().trim() : "";

  if (!text) {
    throw new Error("Google AI returned an empty response.");
  }

  return {
    text,
    raw: response,
  };
}
