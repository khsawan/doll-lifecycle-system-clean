function fieldLine(label, value) {
  return `- ${label}: ${value ? String(value).trim() : "Not provided"}`;
}

export function buildStoryPrompt(payload = {}) {
  const universe = payload.universe || {};

  return [
    "You are writing warm, child-friendly short stories for a handmade doll character.",
    "Use simple language, emotional coherence, and stay aligned with the character and universe details.",
    "Write 2 or 3 distinct story variations for the same doll.",
    "Each variation must stay within the brand voice and the same universe and character context.",
    "Each variation must include:",
    '- "id": a machine-safe identifier such as "v1", "v2", or "v3"',
    '- "label": a short operator-friendly label such as "Gentle & calm"',
    '- "story_main": one short warm story',
    "Return valid JSON only with this exact shape:",
    "{",
    '  "variations": [',
    '    { "id": "...", "label": "...", "story_main": "..." }',
    "  ]",
    "}",
    "Do not include markdown, code fences, commentary, or extra keys.",
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
