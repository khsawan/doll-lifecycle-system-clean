import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines.js";

export function buildV1ContentPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: V1 PUBLIC EXPERIENCE CONTENT]",
    "Write the child's first digital experience with this doll.",
    "The doll is speaking from inside her world.",
    "This content must feel warm, magical, safe, and immediately personal.",
    "",
    "Requirements:",
    "- intro_script must feel like the doll is greeting the child directly",
    "- story_pages must contain exactly 4 pages",
    "- each page should feel like one warm moment inside the doll's universe",
    "- play_activity must contain exactly 3 gentle choices",
    "- every choice must lead to a positive, emotionally safe outcome",
    "- no danger, no conflict, no wrong choice",
    "",
    "Return valid JSON only with this exact shape:",
    '{',
    '  "intro_script": "...",',
    '  "story_pages": ["...", "...", "...", "..."],',
    '  "play_activity": {',
    '    "prompt": "...",',
    '    "choices": [',
    '      { "id": "...", "label": "...", "result_text": "..." },',
    '      { "id": "...", "label": "...", "result_text": "..." },',
    '      { "id": "...", "label": "...", "result_text": "..." }',
    '    ]',
    '  }',
    '}',
    "Do not include markdown, code fences, or extra keys.",
  ].join("\n");

  return [
    BRAND_BLOCK,
    UNIVERSE_BLOCK(payload),
    CHARACTER_BLOCK(payload),
    TASK_BLOCK,
  ].join("\n\n");
}
