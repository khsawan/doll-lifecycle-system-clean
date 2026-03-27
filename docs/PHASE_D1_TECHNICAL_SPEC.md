# PHASE D1 — TECHNICAL SPECIFICATION
## Content Variation Engine

**Prepared by:** Codex
**For:** Founder + implementation workflow
**Status:** D1-1 specification draft

---

## CONTEXT

Current AI generation returns one option only.
The operator must either accept that result or regenerate blindly.

Phase D1 introduces 2–3 selectable variations for each supported AI generation task.
The operator reviews the returned options, selects the best version, and saves only the selected result.

This phase is intended to reduce review time, improve quality control, and remove blind regeneration from the operator workflow.

---

## CURRENT STATE

- AI generation currently returns a single normalized output per task
- The operator has no side-by-side comparison option
- Regeneration is currently the only way to request an alternative
- Persisted storage assumes one final selected result, not a candidate set

---

## WHAT THIS PHASE DOES

- Adds a variation response layer to AI generation
- Returns 2–3 structured options instead of one result
- Allows the operator to select the best option directly
- Persists only the selected variation
- Keeps non-selected candidate variations in local UI state only
- Introduces no schema changes

---

## SCOPE

### In Scope

- Variation response format for supported AI tasks
- Normalization of multi-option responses
- Backward-compatible handling of old single-result responses
- Local UI state for candidate variation review
- Persistence of only the selected final version
- Story-only implementation first in D1-2

### Out of Scope

- Schema changes
- Supabase persistence for candidate variation sets
- Changes to pipeline progression behavior
- Changes to commerce behavior
- Changes to QR logic
- Changes to public doll route behavior
- Full multi-task rollout before story-only validation passes

---

## PROTECTED AREAS

The following areas must not be changed by Phase D1:

- `pipeline_state` logic
- commerce logic
- QR logic
- public doll route behavior

---

## CANONICAL VARIATION RESPONSE FORMAT

Phase D1 uses Option C as the canonical response shape:

```json
{
  "variations": [
    {
      "id": "option_a",
      "label": "Option A",
      "task": {}
    },
    {
      "id": "option_b",
      "label": "Option B",
      "task": {}
    }
  ]
}
```

Rules:

- `variations` must contain 2 or 3 entries for Phase D1 generation
- each variation must contain `id`, `label`, and `task`
- `id` must be stable and machine-safe
- `label` is operator-facing
- `task` contains the task-specific payload in the same shape currently expected by the system

---

## TASK EXAMPLES

### Story Example

```json
{
  "variations": [
    {
      "id": "option_a",
      "label": "Option A",
      "task": {
        "story_main": "..."
      }
    },
    {
      "id": "option_b",
      "label": "Option B",
      "task": {
        "story_main": "..."
      }
    }
  ]
}
```

### Content Pack Example

```json
{
  "variations": [
    {
      "id": "option_a",
      "label": "Option A",
      "task": {
        "short_intro": "...",
        "content_blurb": "...",
        "promo_hook": "...",
        "cta": "..."
      }
    },
    {
      "id": "option_b",
      "label": "Option B",
      "task": {
        "short_intro": "...",
        "content_blurb": "...",
        "promo_hook": "...",
        "cta": "..."
      }
    }
  ]
}
```

### Social Example

```json
{
  "variations": [
    {
      "id": "option_a",
      "label": "Option A",
      "task": {
        "social_hook": "...",
        "social_caption": "...",
        "social_cta": "..."
      }
    },
    {
      "id": "option_b",
      "label": "Option B",
      "task": {
        "social_hook": "...",
        "social_caption": "...",
        "social_cta": "..."
      }
    }
  ]
}
```

### V1 Content Example

```json
{
  "variations": [
    {
      "id": "option_a",
      "label": "Option A",
      "task": {
        "intro_script": "...",
        "story_pages": ["...", "...", "...", "..."],
        "play_activity": {
          "prompt": "...",
          "choices": [
            { "id": "...", "label": "...", "result_text": "..." },
            { "id": "...", "label": "...", "result_text": "..." },
            { "id": "...", "label": "...", "result_text": "..." }
          ]
        }
      }
    },
    {
      "id": "option_b",
      "label": "Option B",
      "task": {
        "intro_script": "...",
        "story_pages": ["...", "...", "...", "..."],
        "play_activity": {
          "prompt": "...",
          "choices": [
            { "id": "...", "label": "...", "result_text": "..." },
            { "id": "...", "label": "...", "result_text": "..." },
            { "id": "...", "label": "...", "result_text": "..." }
          ]
        }
      }
    }
  ]
}
```

---

## BACKWARD COMPATIBILITY RULE

Old single-result responses must continue to work.

If a task returns the legacy single-result format, normalization must wrap it into a one-item `variations` array:

```json
{
  "variations": [
    {
      "id": "option_a",
      "label": "Option A",
      "task": {}
    }
  ]
}
```

This preserves compatibility with existing prompts, fallback flows, and saved-result expectations.

---

## IMPLEMENTATION STRATEGY

- Persist only the selected variation
- Keep candidate variations in local UI state
- No schema changes in this phase
- Normalize both multi-variation and legacy single-result responses into one internal selection model
- Apply D1-2 to story generation first before extending to other task types

---

## EXECUTION ORDER

Execute in this order:

### D1-1 — Specification Document

- Create and review `docs/PHASE_D1_TECHNICAL_SPEC.md`
- Confirm scope, protected areas, and canonical response format

### D1-2 — Story-Only Implementation First

- Implement variation handling for story generation only
- Validate normalization, operator selection, and persistence behavior
- Do not extend to other tasks until story-only validation passes

### Later Tasks — After Validation

- Extend the variation engine to `content_pack`
- Extend the variation engine to `social`
- Extend the variation engine to `v1_content`
- Re-run validation after each expansion step

---

## VALIDATION CHECKLIST

```text
1. 2–3 variations returned → Yes/No
2. id + label exist on every variation → Yes/No
3. operator can select one variation → Yes/No
4. only selected version is saved → Yes/No
5. no regression in protected areas → Yes/No
```

---

## IMPORTANT NOTES

- The selected result remains the only persisted record for the task
- Candidate variations are review-time data, not durable database state
- Phase D1 introduces no external dependencies
- Protected areas remain unchanged throughout the phase

