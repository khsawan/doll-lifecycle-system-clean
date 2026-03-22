function fieldLine(label, value) {
  return `- ${label}: ${value ? String(value).trim() : "Not provided"}`;
}

export function buildStoryPrompt(payload = {}) {
  const universe = payload.universe || {};

  return [
    "You are writing a warm, child-friendly short story for a handmade doll character.",
    "Use simple language, emotional coherence, and stay aligned with the character and universe details.",
    "Write one short story only.",
    "Return valid JSON only with this exact shape:",
    '{ "story_main": "..." }',
    "Do not include markdown, code fences, or extra keys.",
    "",
    "Character Details",
    fieldLine("Name", payload.name),
    fieldLine("Theme", payload.theme_name),
    fieldLine("Personality traits", payload.personality_traits),
    fieldLine("Emotional hook", payload.emotional_hook),
    fieldLine("Expression feel", payload.expression_feel),
    fieldLine("Character world", payload.character_world),
    fieldLine("Color palette", payload.color_palette),
    fieldLine("Notable features", payload.notable_features),
    "",
    "Universe Details",
    fieldLine("Universe name", universe.name),
    fieldLine("Universe description", universe.description),
    fieldLine("Universe tone", universe.tone),
    fieldLine("Universe environment", universe.environment_description),
  ].join("\n");
}
