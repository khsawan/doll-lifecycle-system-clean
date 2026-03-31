# PHASE B — TECHNICAL SPECIFICATION
## Maille et Merveille — Prompt Injection System

**Prepared by:** Claude (Strategic Lead)  
**For:** ChatGPT (Planning) + Codex (Execution)  
**Coordinator:** Founder  
**Status:** Ready to execute — Phase A complete and committed

---

## CONTEXT

Phase A is complete. `docs/CONTENT_GUIDELINES.md` is committed to the repo.  
Phase B introduces a canonical AI identity layer — a Prompt Injection System  
that replaces manual tone instructions in every prompt builder with  
structured, shared, injectable blocks derived from the guidelines.

This is the most important architectural change to the AI layer in the system.  
It must be executed carefully, one step at a time, with validation between steps.

---

## CURRENT STATE (what exists today)

Four prompt builder files, each containing:
- Manual tone instructions (duplicated across all four)
- Character fields injected inline via `fieldLine(label, value)`
- Universe fields injected inline via `fieldLine(label, value)`
- No shared brand memory
- No guidelines reference

```
lib/ai/prompts/story.js
lib/ai/prompts/contentPack.js
lib/ai/prompts/social.js
lib/ai/prompts/v1Content.js
```

Current payload structure (identical across all builders):
```javascript
// Character fields available on payload:
payload.name
payload.theme_name
payload.personality_traits
payload.emotional_hook
payload.expression_feel
payload.character_world
payload.color_palette
payload.notable_features

// Universe fields available on payload:
payload.universe.name
payload.universe.description
payload.universe.tone
payload.universe.environment_description

// Extended character brief fields (NEW — added in Phase B):
payload.emotional_spark
payload.emotional_essence
payload.temperament
payload.emotional_role
payload.small_tenderness
payload.signature_trait
payload.sample_voice_line
```

---

## TARGET STATE (what Phase B produces)

### New file: `lib/ai/guidelines.js`

This file is the single source of truth for all injectable prompt blocks.  
No prompt builder may contain tone, style, or brand instructions directly.  
All such instructions must come only from this file.

---

## EXACT SPECIFICATION: `lib/ai/guidelines.js`

```javascript
// lib/ai/guidelines.js
// Single source of truth for all AI prompt injection blocks.
// All prompt builders must import from this file.
// No prompt builder may contain brand/tone/style instructions directly.

function fieldLine(label, value) {
  return `- ${label}: ${value ? String(value).trim() : "Not provided"}`;
}

// ─────────────────────────────────────────────
// BRAND CONSTANTS BLOCK
// Injected first in every prompt.
// Never modified per-task, per-universe, or per-character.
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
  "- Never use urgency, scarcity, or sales language of any kind",
  "- Never introduce fear, unresolved conflict, or anxiety",
  "- Never write down to children — speak to their imagination, not their reading level",
  "- Never describe the doll as a product, item, or toy",
  "- Always write as if the doll's world is real and the child is visiting it",
  "- Every story challenge must resolve warmly — never ambiguously",
  "",
  "Tone reference sentence:",
  "Somewhere in a small house in the woods, handmade dolls quietly awaken…",
  "waiting for the right child to bring them to life.",
].join("\n");


// ─────────────────────────────────────────────
// UNIVERSE BLOCK
// Injected second. Specific to the doll's universe.
// Receives payload and extracts universe fields.
// ─────────────────────────────────────────────

export function UNIVERSE_BLOCK(payload = {}) {
  const universe = payload.universe || {};

  const universeName = universe.name
    ? String(universe.name).trim()
    : "Not provided";

  const lines = [
    `[UNIVERSE: ${universeName}]`,
    "The child is visiting this world — they have crossed a threshold into it.",
    "Write from inside the world, not about it.",
    "",
    fieldLine("Universe name", universe.name),
    fieldLine("Universe description", universe.description),
    fieldLine("Emotional core", universe.tone),
    fieldLine("Environment", universe.environment_description),
  ];

  return lines.join("\n");
}


// ─────────────────────────────────────────────
// CHARACTER BLOCK
// Injected third. Specific to the individual doll.
// Receives payload and extracts all character fields.
// Extended fields (emotional_spark, etc.) are used when available.
// Falls back gracefully when extended fields are not yet populated.
// ─────────────────────────────────────────────

export function CHARACTER_BLOCK(payload = {}) {
  const dollName = payload.name
    ? String(payload.name).trim()
    : "Unnamed doll";

  const lines = [
    `[CHARACTER: ${dollName}]`,
    "",
    "— Core identity —",
    fieldLine("Name", payload.name),
    fieldLine("Theme", payload.theme_name),
    fieldLine("Character world", payload.character_world),
    "",
    "— Emotional identity —",
    fieldLine("Emotional spark", payload.emotional_spark),
    fieldLine("Emotional essence", payload.emotional_essence),
    fieldLine("Emotional hook", payload.emotional_hook),
    fieldLine("Temperament", payload.temperament),
    fieldLine("Emotional role in her world", payload.emotional_role),
    "",
    "— Character depth —",
    fieldLine("Small tenderness", payload.small_tenderness),
    fieldLine("Signature trait", payload.signature_trait),
    fieldLine("Sample line in her voice", payload.sample_voice_line),
    "",
    "— Physical revelation —",
    fieldLine("Expression feel", payload.expression_feel),
    fieldLine("Color palette", payload.color_palette),
    fieldLine("Notable features", payload.notable_features),
    fieldLine("Personality traits", payload.personality_traits),
  ];

  return lines.join("\n");
}
```

---

## EXACT SPECIFICATION: Updated prompt builders

### Rule for all builders
Every builder must:
1. Import `BRAND_BLOCK`, `UNIVERSE_BLOCK`, `CHARACTER_BLOCK` from `../guidelines`
2. Remove ALL direct tone, style, and brand instructions
3. Keep ONLY the task-specific instructions and JSON shape definition
4. Compose the prompt as: `[BRAND_BLOCK, UNIVERSE_BLOCK(payload), CHARACTER_BLOCK(payload), TASK_BLOCK].join("\n\n")`

---

### `lib/ai/prompts/story.js` — updated

```javascript
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
```

---

### `lib/ai/prompts/contentPack.js` — updated

```javascript
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
```

---

### `lib/ai/prompts/social.js` — updated

```javascript
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
```

---

### `lib/ai/prompts/v1Content.js` — updated

```javascript
import { BRAND_BLOCK, UNIVERSE_BLOCK, CHARACTER_BLOCK } from "../guidelines";

export function buildV1ContentPrompt(payload = {}) {
  const TASK_BLOCK = [
    "[TASK: V1 PUBLIC EXPERIENCE CONTENT]",
    "Write the full content pack for this doll's public digital experience.",
    "The child is visiting the doll's world — they have crossed a threshold into it.",
    "Every piece of content must feel like the doll is real and the world is alive.",
    "",
    "Content required:",
    "",
    "1. intro_script",
    "The doll speaking directly to the child.",
    "Warm, immediate — as if she has been waiting for this child specifically.",
    "2–3 sentences maximum. First person. Her voice, not the narrator's voice.",
    "",
    "2. story_pages",
    "Exactly 4 pages. Each page is one moment — not one plot beat.",
    "The child moves through the world, not through a story structure.",
    "Each page: 2–4 sentences. Simple. Breathable. Allow pauses.",
    "",
    "3. play_activity",
    "One gentle question or invitation to choose.",
    "Exactly 3 choices. Every choice is right — there is no wrong answer in this world.",
    "Each choice has: id (short snake_case), label (short action phrase), result_text (warm outcome sentence).",
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
```

---

## EXECUTION ORDER FOR CODEX

Execute in this exact order. Do not combine steps.

### Step B1 — Create `lib/ai/guidelines.js`
Create the new file exactly as specified above.  
Do not modify any existing files in this step.  
**Validation:** File exists at correct path. No existing functionality changed.

### Step B2 — Update `lib/ai/prompts/story.js`
Replace with updated version as specified above.  
**Validation:** Generate a story for one existing doll. Output must be valid JSON  
with `story_main` key. Check that brand voice is present in output.

### Step B3 — Update `lib/ai/prompts/contentPack.js`
Replace with updated version as specified above.  
**Validation:** Generate a content pack for one existing doll. Output must be  
valid JSON with all four keys. Check tone against brand guidelines.

### Step B4 — Update `lib/ai/prompts/social.js`
Replace with updated version as specified above.  
**Validation:** Generate social content for one existing doll. Check that output  
does not contain any urgency or sales language.

### Step B5 — Update `lib/ai/prompts/v1Content.js`
Replace with updated version as specified above.  
**Validation:** Generate V1 content for one existing doll. Confirm exactly 4 story  
pages and exactly 3 play choices returned. Check intro_script is in character voice.

---

## VALIDATION GATE — PHASE B COMPLETE

After all five steps, perform this quality check:

Generate ALL content types for one complete doll (story + content pack + social + V1).  
Compare output against these questions:

- [ ] Does every output feel like it comes from the same brand?
- [ ] Is the doll a living character in every output — never a product?
- [ ] Is there any urgency, sales, or pushy language anywhere?
- [ ] Does the intro_script sound like the specific doll — not a generic character?
- [ ] Do the story pages feel like the child is inside the world?

If all five pass: Phase B is complete. Report results to Claude for review.  
If any fail: identify which step produced the failure and fix before proceeding.

---

## IMPORTANT NOTES FOR CODEX

1. The `fieldLine` function is duplicated in the current prompt builders.  
   In `guidelines.js` it is defined once and used internally.  
   The prompt builders no longer need their own `fieldLine` — they import  
   everything they need from `guidelines.js`.

2. The extended character fields (`emotional_spark`, `emotional_essence`,  
   `temperament`, `emotional_role`, `small_tenderness`, `signature_trait`,  
   `sample_voice_line`) are NEW fields that do not yet exist on all doll records.  
   The `CHARACTER_BLOCK` handles missing fields gracefully via `fieldLine`  
   which outputs "Not provided" when a value is absent.  
   This means the update is backward-compatible with all existing doll records.

3. Do not modify `lib/ai/index.js`, `lib/ai/normalize.js`,  
   `app/api/ai/generate/route.js`, or any other file.  
   Only the five files listed in the execution order are touched in Phase B.

4. Do not modify the JSON output shapes. Normalize.js depends on them exactly.

---

## AFTER PHASE B — WHAT COMES NEXT

Phase B completion unlocks Phase B3:  
Persisting content management statuses (`generation_status`, `review_status`,  
`publish_status`) to Supabase.

That specification will be provided by Claude after Phase B validation passes.
