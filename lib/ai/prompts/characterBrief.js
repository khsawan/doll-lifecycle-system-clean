import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines.js";

export function buildCharacterBriefPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: CHARACTER BRIEF]",
    "You are writing the inner character brief for this doll.",
    "Write from inside her world — specific, sensory, and true to her universe tone.",
    "Every field must feel like it could only belong to her — not a generic doll, not a type.",
    "",
    "Field instructions:",
    "- emotional_spark: What lights her up. What makes her come alive. Max 80 characters.",
    "- emotional_essence: The feeling she leaves behind in a room. Max 80 characters.",
    "- temperament: How she moves through the world — fast, slow, careful, bold. Max 80 characters.",
    "- emotional_role: The role she plays in a child's emotional life. Max 120 characters.",
    "- small_tenderness: One small, specific, tender detail only she would do. Max 150 characters.",
    "- signature_trait: The one thing anyone would say about her first. Max 80 characters.",
    "- sample_voice_line: One sentence she might actually say, in her own voice. Must sound like dialogue — something she would genuinely say to a child — not a description of her. Max 200 characters.",
    "",
    "Return valid JSON only with this exact shape:",
    "{",
    '  "emotional_spark": "",',
    '  "emotional_essence": "",',
    '  "temperament": "",',
    '  "emotional_role": "",',
    '  "small_tenderness": "",',
    '  "signature_trait": "",',
    '  "sample_voice_line": ""',
    "}",
    "Do not include markdown, code fences, preamble, or extra keys.",
  ].join("\n");

  return [
    BRAND_BLOCK,
    UNIVERSE_BLOCK(payload),
    CHARACTER_BLOCK(payload),
    TASK_BLOCK,
  ].join("\n\n");
}
