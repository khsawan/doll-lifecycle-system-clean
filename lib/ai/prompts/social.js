import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines";

export function buildSocialPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: SOCIAL CONTENT]",
    "Write social-ready copy for this doll character for Instagram.",
    "The hook must create a moment of recognition —",
    "a parent sees themselves, their child, or something they wish existed.",
    "The caption deepens the feeling — it does not sell.",
    "The CTA is the gentlest possible next step.",
    "",
    "Field guidance:",
    '- "social_hook": one short attention-grabbing line — leads with feeling',
    '- "social_caption": warm Instagram-ready caption — emotional, not promotional',
    '- "social_cta": short gentle call to action — soft invitation only',
    "",
    "Return valid JSON only with this exact shape:",
    '{ "social_hook": "...", "social_caption": "...", "social_cta": "..." }',
    "Do not include markdown, code fences, or extra keys.",
  ].join("\n");

  return [
    BRAND_BLOCK,
    UNIVERSE_BLOCK(payload),
    CHARACTER_BLOCK(payload),
    TASK_BLOCK,
  ].join("\n\n");
}
