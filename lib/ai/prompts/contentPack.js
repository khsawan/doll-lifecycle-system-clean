function fieldLine(label, value) {
  return `- ${label}: ${value ? String(value).trim() : "Not provided"}`;
}

export function buildContentPackPrompt(payload = {}) {
  const universe = payload.universe || {};

  return [
    "You are writing warm, child-friendly, brand-consistent marketing copy for a handmade doll character.",
    "Keep the tone gentle, magical, and emotionally coherent with the character and universe details.",
    "Write copy that feels comforting and premium without sounding pushy or salesy.",
    "Return valid JSON only with this exact shape:",
    '{ "short_intro": "...", "content_blurb": "...", "promo_hook": "...", "cta": "..." }',
    "Do not include markdown, code fences, or extra keys.",
    "",
    "Field guidance",
    '- "short_intro" should be a short, warm intro suitable for a caption opener.',
    '- "content_blurb" should be a short brand-style blurb for the doll.',
    '- "promo_hook" should be one concise promotional hook.',
    '- "cta" should be a short, gentle call to action.',
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
