function fieldLine(label, value) {
  return `- ${label}: ${value ? String(value).trim() : "Not provided"}`;
}

// ─────────────────────────────────────────────
// BRAND BLOCK
// ─────────────────────────────────────────────

export const BRAND_BLOCK = [
  "[BRAND VOICE — MAILLE ET MERVEILLE]",
  "You are writing for Maille et Merveille — a brand of handmade story-driven dolls.",
  "",
  "Voice: soft, warm, motherly, magical — whispering to a child's imagination.",
  "Never commercial, never pushy, never loud, never exaggerated.",
  "The doll is always a living character. Never a product, item, or toy.",
  "",
  "Emotional goal for the child: This feels like a real little best friend made just for me.",
  "Emotional goal for the parent: This is meaningful, beautiful, safe, and truly enriching.",
  "",
  "Non-negotiable rules:",
  "- Never use urgency, scarcity, or sales language",
  "- Never introduce fear or anxiety",
  "- Never write down to children",
  "- Always treat the doll as a real character",
  "- Always resolve stories warmly",
  "",
  "Tone reference:",
  "Somewhere in a small house in the woods, handmade dolls quietly awaken…",
].join("\n");


// ─────────────────────────────────────────────
// UNIVERSE BLOCK
// ─────────────────────────────────────────────

export function UNIVERSE_BLOCK(payload = {}) {
  const universe = payload.universe || {};
  const toneRules =
    universe.tone_rules && typeof universe.tone_rules === "object"
      ? universe.tone_rules
      : {};

  return [
    `[UNIVERSE: ${universe.name || "Not provided"}]`,
    "The child is visiting this world — write from inside it, not about it.",
    "",
    fieldLine("Universe name", universe.name),
    fieldLine("Description", universe.description),
    fieldLine("Emotional core", universe.emotional_core),
    fieldLine("Tonal register", toneRules.voice_register),
    fieldLine("Tonal axis", toneRules.tonal_axis),
    fieldLine("Environment", universe.environment_description || universe.character_world),
  ].join("\n");
}


// ─────────────────────────────────────────────
// CHARACTER BLOCK
// ─────────────────────────────────────────────

export function CHARACTER_BLOCK(payload = {}) {
  return [
    `[CHARACTER: ${payload.name || "Unnamed"}]`,
    "",
    "— Core —",
    fieldLine("Name", payload.name),
    fieldLine("Theme", payload.theme_name),
    fieldLine("World", payload.character_world),
    "",
    "— Emotion —",
    fieldLine("Emotional spark", payload.emotional_spark),
    fieldLine("Emotional essence", payload.emotional_essence),
    fieldLine("Emotional hook", payload.emotional_hook),
    fieldLine("Temperament", payload.temperament),
    "",
    "— Depth —",
    fieldLine("Small tenderness", payload.small_tenderness),
    fieldLine("Signature trait", payload.signature_trait),
    fieldLine("Voice line", payload.sample_voice_line),
    "",
    "— Physical —",
    fieldLine("Expression", payload.expression_feel),
    fieldLine("Colors", payload.color_palette),
    fieldLine("Features", payload.notable_features),
    fieldLine("Traits", payload.personality_traits),
  ].join("\n");
}
