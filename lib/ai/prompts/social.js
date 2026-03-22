function fieldLine(label, value) {
  return `- ${label}: ${value ? String(value).trim() : "Not provided"}`;
}

export function buildSocialPrompt(payload = {}) {
  const universe = payload.universe || {};

  return [
    "You are writing warm, brand-consistent, social-ready copy for a handmade doll character.",
    "Keep the tone gentle, emotionally warm, and suitable for a boutique handmade doll brand.",
    "Write copy that is polished for social media while still sounding kind, child-friendly, and inviting.",
    "Return valid JSON only with this exact shape:",
    '{ "social_hook": "...", "social_caption": "...", "social_cta": "..." }',
    "Do not include markdown, code fences, or extra keys.",
    "",
    "Field guidance",
    '- "social_hook" should be one short attention-grabbing line.',
    '- "social_caption" should be a warm social-ready caption.',
    '- "social_cta" should be a short, gentle call to action.',
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
