import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines.js";

export function buildStoryPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: STORY]",
    "Write 3 distinct story variations for this doll character.",
    "The story is set inside the doll's universe - the child is visiting her world.",
    "Use simple language with emotional coherence.",
    "The story should have a gentle arc: a small moment, a warm feeling, a soft resolution.",
    "Each variation must include:",
    '- "id": a machine-safe identifier such as "v1", "v2", or "v3"',
    '- "label": a short operator-friendly label',
    '- "story_main": one short warm story',
    "Return valid JSON only with this exact shape:",
    "{",
    '  "variations": [',
    '    { "id": "v1", "label": "...", "story_main": "..." },',
    '    { "id": "v2", "label": "...", "story_main": "..." },',
    '    { "id": "v3", "label": "...", "story_main": "..." }',
    "  ]",
    "}",
    "Do not include markdown, code fences, or extra keys.",
  ].join("\n");

  return [
    BRAND_BLOCK,
    UNIVERSE_BLOCK(payload),
    CHARACTER_BLOCK(payload),
    TASK_BLOCK,
  ].join("\n\n");
}
