import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines";

export function buildContentPackPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: CONTENT PACK]",
    "Write warm, brand-consistent marketing copy for this doll character.",
    "Speak to the parent's emotional intelligence — never to their purchasing logic.",
    "Copy must feel comforting and premium. Never pushy or salesy.",
    "",
    "Field guidance:",
    '- "short_intro": short warm intro suitable for a caption opener',
    '- "content_blurb": short brand-style blurb for the doll — character-first, never product-first',
    '- "promo_hook": one concise line that leads with feeling, not feature',
    '- "cta": short gentle call to action — invites, never pressures',
    "",
    "Return valid JSON only with this exact shape:",
    '{ "short_intro": "...", "content_blurb": "...", "promo_hook": "...", "cta": "..." }',
    "Do not include markdown, code fences, or extra keys.",
  ].join("\n");

  return [
    BRAND_BLOCK,
    UNIVERSE_BLOCK(payload),
    CHARACTER_BLOCK(payload),
    TASK_BLOCK,
  ].join("\n\n");
}
