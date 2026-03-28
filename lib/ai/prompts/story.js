import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines";

export function buildStoryPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: STORY]",
    "Write one short, warm story for this doll character.",
    "The story is set inside the doll's universe — the child is visiting her world.",
    "Use simple language with emotional coherence.",
    "The story should have a gentle arc: a small moment, a warm feeling, a soft resolution.",
    "Return valid JSON only with this exact shape:",
    '{ "story_main": "..." }',
    "Do not include markdown, code fences, or extra keys.",
  ].join("\n");

  return [
    BRAND_BLOCK,
    UNIVERSE_BLOCK(payload),
    CHARACTER_BLOCK(payload),
    TASK_BLOCK,
  ].join("\n\n");
}
