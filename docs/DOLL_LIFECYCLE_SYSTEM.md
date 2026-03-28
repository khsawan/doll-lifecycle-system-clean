# Doll Lifecycle System

## Usage Rule

This document must be:

- read before any structural/system change
- updated whenever system behavior or architecture changes

This document is the long-term source of truth for what the Doll Lifecycle System is, how it is structured, and how production progression works.

## Vision

- The Doll Lifecycle System transforms handmade dolls into physical + digital products.
- It is a production operating system, not just a tool.
- It connects craft, identity, content, digital activation, and commerce into one controlled workflow.
- The goal is operational clarity: every doll should move through the same structured lifecycle with visible status and readiness.

## Architecture

The system is organized into three layers:

- Creation Lab: the future upstream layer for ideation, concept generation, universe design, and AI-assisted creation.
- Production System: the current core layer where dolls are registered, developed, validated, and moved through the production pipeline.
- Commerce & Distribution: the downstream layer where sellability, public access, distribution, and later customer-facing operations are managed.

## Production Pipeline

The production pipeline is the main operational framework of the system. It defines how a doll moves from first registration to full readiness.

### Registered

- Meaning: the doll exists as an official production record inside the system.
- Focus: registration, base production identity, and initial physical record setup.
- Completion represents: the doll is properly entered into the operating system and is ready to move into character development.

### Character

- Meaning: the doll becomes a defined character rather than only a registered object.
- Focus: name, identity, emotional core, personality, and character world.
- Completion represents: the doll's narrative identity is clear enough to support story and content generation.

### Content

- Meaning: the doll's story assets and communication assets are created.
- Focus: story content, content pack content, and social-facing content.
- Completion represents: the doll has the core narrative and content assets needed for digital presentation and launch preparation.

### Gateway

- Meaning: the doll is activated as a digital and commercial product node.
- Focus: digital identity, public access, QR/public-link readiness, and commerce gating.
- Completion represents: the doll is digitally ready and commercially eligible to move toward sale and distribution.

### Ready

- Meaning: the doll has passed through the full production workflow.
- Focus: final operational readiness across the full system.
- Completion represents: the doll is fully validated as a production-ready product and can proceed into downstream commercial workflows.

## Stage Lock System

The pipeline uses a controlled lock model to ensure sequential progression.

- Each stage has one of three statuses: `open`, `completed`, or `locked`.
- `open` means the stage is the current active working stage.
- `completed` means the stage has been finished and validated.
- `locked` means the stage is not yet available because an earlier stage is still active or has been reopened.
- Only one stage can be active at a time. This is the one active stage rule.
- Completing the current `open` stage marks it as `completed` and unlocks the next stage by setting that stage to `open`.
- Reopening a completed stage sets that stage back to `open` and locks all downstream stages again.
- Reopen behavior protects workflow integrity by preventing downstream stages from remaining active after an upstream change.
- Stage state is persisted in `pipeline_state`.
- `pipeline_state` is the durable workflow record and preserves the production progression state for each doll.

## Readiness Model

Readiness is a validation model. It is related to the pipeline, but it is not the same thing as stage progression.

### Production Readiness

- Validates the core production record and physical-product essentials.
- Covers the minimum information required for the doll to exist as a managed production item.

### Character Readiness

- Validates character identity.
- Covers the doll's name, theme or world, personality, emotional hook, expression, and narrative identity structure.

### Content Readiness

- Validates narrative and communication assets.
- Covers story content, content pack content, and social content needed to represent the doll consistently.

### Digital Readiness

- Validates digital activation.
- Covers the public-facing digital identity such as slug, public link, and QR-linked access layer.

### Commerce Readiness

- Validates whether the doll is commercially eligible inside the product system.
- This is controlled through `commerce_status`.

### Gateway Rule

- Gateway readiness depends on digital readiness plus `commerce_status`.
- Gateway is complete only when the doll is digitally ready and `commerce_status` is `ready_for_sale`.
- Orders or CRM activity do not define Gateway readiness.

## Data Model

### `pipeline_state` (`jsonb`)

- Stores the structured per-stage workflow state.
- Persists the status of each pipeline stage.
- Acts as the source of truth for production progression.
- Supports normalized stage behavior across current and legacy records.

### `commerce_status`

- Defines product sellability state.
- Allowed values are `draft`, `ready_for_sale`, and `unavailable`.
- `ready_for_sale` is the key commercial state used by Gateway readiness.
- This field controls product readiness for commerce, not customer order flow.

### Audio Model (Phase C2)

Audio is stored in the `audio_urls` JSONB field on the `dolls` table.

The structure supports layered audio:

```json
{
  "voice": {
    "intro": "url",
    "story": "url",
    "play": "url"
  },
  "ambient": {
    "universe": "url"
  },
  "scene": {
    "welcome": "url",
    "story": "url"
  }
}
```

- `voice`: character-driven narration audio (doll voice).
- `ambient`: universe-level background audio (shared emotional tone).
- `scene`: optional overrides for specific scenes (future use).

Legacy format:

```json
{
  "intro": "...",
  "story": "...",
  "play": "..."
}
```

Normalization rule:

- Legacy keys map to `audio_urls.voice`.
- The system must support both shapes during transition.

- Audio is read-only for production flow.
- Audio does not affect:
- `pipeline_state`
- `commerce_status`
- QR logic
- public route structure

Phase C2A:

- Supports only voice layer playback (`intro` + `story`).

Phase C2B:

- Introduces ambient layer (`universe`).

Phase C2C:

- Optional scene-level overrides.

### CRM Separation

- CRM and order tracking are separate from product readiness.
- Orders describe customer and fulfillment lifecycle activity.
- Product readiness describes whether the doll itself is operationally ready.
- The system must keep these concerns separate.

## Selected Doll Dashboard Model

The selected-doll admin workspace now opens through a doll-specific dashboard entry model.

- Each doll keeps one centered admin flow around that selected doll.
- The dashboard is the entry point for choosing which operational workspace to open next.
- From the dashboard, operators open either `Production Pipeline` or `Content Studio`.
- Only one of these doll-specific workspaces is visible at a time.
- Both workspaces remain inside the same doll-centered admin flow.

## Admin Content Management Layer

A lightweight content management layer now exists inside the selected-doll admin workspace.

- It is opened through the doll-specific `Content Studio` workspace.
- It is a management surface for content operations, not a replacement for the pipeline.
- The pipeline remains the main control surface for production progression.
- The `Production Pipeline` workspace preserves the existing unified workflow header, stage progression, and stage-driven operational views.
- Build 1 adds a compact Content Overview Bar and Content Production Panel inside Content Studio.

### Management Statuses

The admin content management layer now tracks three management statuses for the selected doll:

- `generation_status`: `not_started` or `generated`
- `review_status`: `draft` or `approved`
- `publish_status`: `hidden` or `live`

### Build 1 Scope

- Build 1 uses UI-level local state only for these management statuses.
- Initial defaults are safely derived when missing.
- `generation_status = not_started`
- `review_status = draft`
- `publish_status = hidden`
- Asset completeness is currently UI-derived from hero image presence, story presence, and QR availability.
- These statuses are persisted to the dolls table in Supabase. Values survive page reloads and are rehydrated on doll selection.
- These statuses do not modify `pipeline_state`, `commerce_status`, QR generation logic, public doll route behavior, or CRM/order flow.
- Phase B3 complete: generation_status, review_status, and publish_status are now structural fields on the dolls table with defaults of not_started, draft, and hidden respectively.

### Build 2A Scope

- `Generate Content` now creates deterministic local V1 content inside Content Studio.
- The local generator derives content from doll identity inputs such as name, personality, world, and mood.
- It generates:
- `intro_script`
- `story_pages` with four pages
- `play_activity` with a prompt and three positive choice results
- Generated content is injected into local UI state only.
- `generation_status` is updated to `generated` when local generation runs.
- No AI API, Supabase persistence, pipeline transition, QR behavior, commerce logic, or public-route behavior is changed by this generation step.

### Build 2B Scope

- Content Studio generation now also persists generated V1 content to the selected doll row in Supabase.
- Persisted fields are:
- `intro_script`
- `story_pages`
- `play_activity`
- Local UI state still updates immediately before persistence completes.
- When persisted generated V1 content exists, the admin rehydrates `generation_status` as `generated` for management-state coherence.
- If persistence fails, locally generated content remains visible in the admin UI and the operator receives an error message.
- This persistence step does not modify `pipeline_state`, QR behavior, commerce logic, CRM/order flow, or public doll route behavior.

### Build 3 Scope

- Content Studio `Generate Content` now uses the real AI generation layer through `/api/ai/generate`.
- The Build 3 AI task returns a structured V1 content pack containing:
- `intro_script`
- `story_pages`
- `play_activity`
- AI generation is based on doll identity inputs such as name, personality, world or theme, and mood.
- AI responses are normalized before use so the admin always receives exactly four story pages and three play choices in a safe structure.
- If AI generation fails, the admin falls back to deterministic local V1 generation instead of breaking the UI.
- Generated content still persists to the selected doll row using:
- `intro_script`
- `story_pages`
- `play_activity`
- This Build 3 flow does not modify `pipeline_state`, QR behavior, commerce logic, CRM/order flow, or public doll route architecture.

## UX Principles

- Workflow-first UI: the interface should guide the operator through production progression, not just expose fields.
- No redundancy: the same concept should not be represented in multiple competing places.
- One source of truth per concept: each operational concept should have one canonical owner in the UI and data model.
- Compact, structured interface: information density should stay high, clear, and controlled.
- Pipeline as main control surface: the pipeline is the primary way operators understand state, progress, and allowed actions.

## Current State

- Phase 9 is complete: Stage Lock System implemented.
- UI architecture is unified.
- The pipeline is established as the main production control surface.
- The Identity card has been introduced as a core summary element for the doll record.
- The public child experience now has a V1 scene shell built around a `V1Experience` read model.
- V1 public scenes are `Welcome`, `Story`, `Play`, and `Meet Friends`.
- The public experience is separate from admin workflow logic and should not depend on `pipeline_state`, readiness, or commerce logic at render time.

### Phase C1 — Ambient Experience (Complete)

- Floating particle system (background-aware, layered gradients)
- Character breathing animation
- Scene entrance animation
- Play choice hover interaction
- Universe-aware atmosphere system

### Phase C2-PREP — Audio Readiness (Complete)

- `audio_urls` JSONB field added to `dolls` table
- Public audio button shell (non-functional)
- System ready for future audio playback integration

### Phase C2A — Intro Voice Playback (Complete)

- Welcome scene audio button now plays intro voice if audio exists
- Supports new structure:
- `audio_urls.voice.intro`
- Supports legacy structure:
- `audio_urls.intro`
- Playback behavior:
- click to play
- click again to pause
- resumes from paused position
- Audio automatically stops and resets when leaving the Welcome scene
- Welcome and Story voice playback do not overlap
- This is currently section-level playback for the Welcome scene
- Playback uses native browser `Audio()` with a single active voice instance
- No layout or UI changes introduced beyond activating existing button
- No impact on:
- `pipeline_state`
- `commerce_status`
- QR logic
- public route behavior

### Phase C2A — Story Voice Playback (Complete)

- Story scene audio button now plays story voice if audio exists
- Supports new structure:
- `audio_urls.voice.story`
- Supports legacy structure:
- `audio_urls.story`
- Playback behavior:
- click to play
- click again to pause
- resumes from paused position
- Audio automatically stops and resets when leaving the Story scene
- Welcome and Story voice playback do not overlap
- This is currently section-level playback for the Story scene
- It is not yet page-level or beat-level story narration
- Playback uses native browser `Audio()` with a single active voice instance
- No layout or UI changes introduced beyond activating existing button
- No impact on:
- `pipeline_state`
- `commerce_status`
- QR logic
- public route behavior

### Phase C2A-2 — Page-Level Story Narration (Complete)

- Story scene now supports page-level narration using:
- `audio_urls.voice.story_pages`
- `story_pages` is an ordered array mapped to Story pages 1–4
- Fallback order:
- `audio_urls.voice.story_pages[index]`
- `audio_urls.voice.story`
- `audio_urls.story`
- Page-level playback behavior:
- audio button controls the currently active story page
- click to play
- click again to pause
- resumes from paused position on the same page
- changing story page stops and resets the previous page audio
- story page changes do not autoplay the next page
- leaving the Story scene stops and resets story narration
- Welcome and Story voice playback do not overlap
- Playback continues to use native browser `Audio()` with a single active voice instance
- The existing Story audio control now exposes visible play/pause/unavailable state
- When page-level narration is absent, the public shell indicates that scene-level fallback narration is active
- No impact on:
- `pipeline_state`
- `commerce_status`
- QR logic
- public route behavior

### Phase C2A-3 — Continuous Story Narration Mode (Complete)

- Story scene now supports an optional Continuous Narration mode
- The toggle defaults to OFF
- When OFF:
- story narration remains manual per page
- page changes do not autoplay
- When ON:
- story narration continues automatically across page changes after the user has explicitly started playback
- turning the toggle ON does not autoplay by itself
- pausing narration ends the active playback session
- leaving the Story scene stops narration and clears the active playback session
- re-entering Story scene does not autoplay until the user presses Play again
- Audio source resolution remains:
- `audio_urls.voice.story_pages[index]`
- `audio_urls.voice.story`
- `audio_urls.story`
- Welcome and Story voice playback do not overlap
- No impact on:
- `pipeline_state`
- `commerce_status`
- QR logic
- public route behavior

### Phase D1 — Content Variation Engine (Complete)

- AI generation now returns one or more variations (normalized into a variation array), typically 2–3 operator-selectable options for supported D1 tasks
- Variations include `id`, `label`, and structured content fields
- Admin UI allows operators to select preferred version before saving
- Only selected version is persisted to Supabase
- Legacy single-output responses are automatically normalized into one variation for backward compatibility
- Applies to:
- Story
- Content Pack
- Social

## Future Phases

- Phase 10: Universe layer for higher-level world and theme structures across multiple dolls.
- Phase 11: AI Creation Lab for upstream concept development, assisted writing, and creation support.
- Phase 12: Digital expansion beyond the current public page and activation layer.
- Phase 13: CRM + Social expansion while keeping customer systems separate from production readiness.
- Phase 14: Roles & Permissions for structured access control and organizational scale.
