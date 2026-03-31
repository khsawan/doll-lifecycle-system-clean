# GAP ANALYSIS & BUILD ROADMAP
## Maille et Merveille — Doll Lifecycle System

**Version:** 1.0  
**Prepared by:** Claude (Strategic Lead)  
**Status:** Active planning document  
**Read alongside:** VISION_DOCUMENT.md, CONTENT_GUIDELINES.md, ARCHITECTURE_HANDOFF.md

---

## CURRENT STATE — WHAT IS BUILT

Everything listed here is built, tested, and on the
`feature/refactor-project-structure` branch.

| System | Status | Notes |
|---|---|---|
| Five-stage production pipeline | Built | Stage lock, readiness model, transitions |
| Prompt injection system | Built | guidelines.js, all four prompt builders |
| Content management persistence | Built | generation/review/publish status in Supabase |
| Public experience — static | Built | Welcome, Story, Play, Meet Friends |
| Public experience — animations | Built | Particles, breathing, entrance, hover |
| Public experience — audio | Built | Voice (intro, story, page-level, continuous), ambient, scene-level |
| Content variation engine | Built | 2–3 options per generation, operator selects |
| AI microservice | Built | Google + Anthropic, local/remote modes |
| Protected admin APIs | Built | Session, catalog, doll, pipeline, story, content, QR, image |
| Architectural refactor | Built | Feature modules, 254 passing tests |
| QR system | Built | Links physical doll to public page |
| Content guidelines | Built | docs/CONTENT_GUIDELINES.md |

---

## THE GAPS — WHAT IS MISSING

Organized by priority layer. Layer 1 must be complete before Layer 2 opens.

---

### PRIORITY LAYER 1 — PRODUCTION SYSTEM FOUNDATIONS
*These gaps block the system from being handed to a collaborator.*
*Nothing else opens until these are resolved.*

---

**GAP 1 — Universe layer**
Priority: CRITICAL

What is missing:
- No universe data model in Supabase
- No universe admin UI (create, edit, manage universes)
- No universe assignment on doll records (universe_id not yet a proper foreign key)
- No universe-level content rules injected into AI prompts
- No universe-level audio management (ambient audio per universe)
- No universe-level visual theme management

What this blocks:
- Every downstream feature depends on universes existing as proper data objects
- Story and activity libraries cannot be built without universe foreign keys
- Universe-aware prompt injection cannot be completed without structured universe data
- The public experience universe-aware atmosphere has no real data to read from

Build approach:
- Supabase: universes table with name, slug, description, tone_rules (JSONB),
  visual_theme (JSONB), audio_urls (JSONB)
- Admin: universe management screen — create, edit, assign dolls
- Doll records: universe_id as proper foreign key to universes table
- AI layer: universe data injected into UNIVERSE_BLOCK in guidelines.js

---

**GAP 2 — Character brief extended fields in admin UI**
Priority: CRITICAL

What is missing:
The CHARACTER_BLOCK in guidelines.js already injects these fields
into every AI generation call — but there is no admin UI to fill them in.
Every field currently outputs "Not provided" for all dolls.

Missing fields:
- emotional_spark
- emotional_essence
- temperament
- emotional_role
- small_tenderness
- signature_trait
- sample_voice_line

What this blocks:
- AI content quality — all generation is currently generic because
  these fields are empty
- Character brief generator cannot be built until fields exist in the UI
- Content variation engine produces variations of generic content,
  not variations of rich character-specific content

Build approach:
- Add extended character brief fields to the Character stage panel in admin
- Fields are optional with "Not provided" fallback (backward compatible)
- Supabase: add columns to dolls table for each field
- Admin: expand Character panel to include brief section with guidance text
  per field (operators need prompting, not blank boxes)

---

**GAP 3 — Story library foundation**
Priority: HIGH

What is missing:
- No stories table linked to universes (current stories table links to dolls)
- No story-to-doll assignment system
- No story template system
- No story builder UI

What this blocks:
- Stories are currently generated per-doll and stored on the doll record
- The vision requires a shared story library at the universe level
- This is a data model change that must happen before the story builder is built

Build approach (Phase 1 — data model only):
- New stories table structure: id, universe_id, title, template_type,
  content (JSONB), status, created_at
- New doll_stories junction table: doll_id, story_id, assigned_at
- Migrate existing doll-level story content to new structure
- Keep backward compatibility — existing content must not break

Build approach (Phase 2 — story builder UI):
- Template selection panel in Content Studio
- Element assembly modal (narration, sounds, images, minimal text)
- AI-assisted refinement per element
- Preview mode
- Approval and publish workflow
- Universe assignment and doll assignment

---

**GAP 4 — Activity library foundation**
Priority: MEDIUM (after story library foundation)

What is missing:
- No activities data model
- No activity builder UI
- No activity display on public experience page

Build approach:
- New activities table: id, universe_id, activity_type, title,
  elements (JSONB), status, created_at
- Activity types: tap_discover, color_decorate, story_choice, do_with_doll
- Public experience: Activities scene added alongside existing scenes
- Doll name personalization: injected at render time from doll record

---

**GAP 5 — Physical production tracking (Layer 2)**
Priority: MEDIUM

What is missing:
- No production_orders table (specs + artist + timeline + status)
- No admin UI for managing physical production orders
- No quality check workflow

Build approach:
- New production_orders table: id, doll_concept_id, artist_name,
  specs (JSONB), status, handed_off_at, expected_at, received_at,
  quality_check_status, notes
- Status flow: drafted → handed_off → in_production → received →
  quality_check → passed → checked_in | rejected
- Admin: simple production board showing all active orders and their status
- Link to check-in: passing quality check unlocks the check-in flow

---

### PRIORITY LAYER 2 — OPERATOR ENABLEMENT
*These features make the system usable by someone other than the founder.*
*Opens after Priority Layer 1 is stable.*

---

**GAP 6 — Character brief generator**
Priority: HIGH (after Gap 2)

What is missing:
The AI task `character_brief` is planned but not built.
An operator fills in sparse starting information (appearance, rough
personality idea, universe) and the system generates a rich structured
character brief.

What this enables:
- Operators who are not expert character designers can create rich briefs
- AI generation quality improves immediately for all downstream tasks
- The brief becomes the single most important input in the system

Build approach:
- New AI task: character_brief in lib/ai/index.js
- New prompt builder: lib/ai/prompts/characterBrief.js
- Admin UI: character brief generator panel in Character stage
- Output: pre-fills all extended character brief fields for operator review

---

**GAP 7 — Review and approval workflow**
Priority: MEDIUM

What is missing:
- Content management statuses are persisted (generation/review/publish)
- But there is no structured review UI — approve/reject per asset
- No asset-level locking after approval

Build approach:
- Expand Content Studio with per-asset approve/reject actions
- Approved assets are locked from AI regeneration unless explicitly reopened
- Review status drives the content readiness check in the pipeline

---

**GAP 8 — Roles and permissions**
Priority: MEDIUM (before first collaborator is onboarded)

What is missing:
- Currently one admin role (the founder)
- No collaborator role with limited permissions
- No audit trail of who changed what

Build approach:
- Collaborator role: can create and edit content, cannot delete dolls,
  cannot change commerce status, cannot archive
- Admin role: full access
- Session model already supports server-backed auth — extend with roles

---

### PRIORITY LAYER 3 — CONTENT AND MARKETING
*Opens after Layer 2 is stable and a collaborator is operational.*

---

**GAP 9 — Social media management layer**
Priority: PLANNED

What is missing:
- No social media content calendar
- No publishing workflow beyond content generation
- No integration with Buffer or Later
- No performance feedback loop

Build approach:
- Social content generated in digital production is pushed to a
  social media queue
- Operator reviews and schedules from within the system
- Buffer/Later API integration for Instagram publishing
- Basic performance tracking (engagement signals back to production)

---

**GAP 10 — Marketing strategy**
Priority: PLANNED (dedicated session)

What is missing:
The complete social media marketing strategy for Maille et Merveille.
This includes: content pillars per universe, posting frequency,
content types (doll reveals, mood content, behind the scenes, seasonal),
growth approach, hashtag strategy, story highlights structure.

This is a full planning session on its own.
It cannot be designed until the production system is producing
consistent, high-quality content.

---

**GAP 11 — Online shop**
Priority: PLANNED (later phase)

What is missing:
A proper e-commerce layer. Product pages, cart, payment, order management.

Current model (DM → WhatsApp/Telegram) continues until production
is stable and volume justifies the shop investment.

The shop connects to the existing pipeline — a doll at "Ready" status
is automatically available in the shop. Order management connects to
the CRM layer.

---

### PRIORITY LAYER 4 — SCALE
*These are designed now but built when the business reaches scale.*

---

**GAP 12 — CRM and customer management**
Status: Architecture planned, not built

**GAP 13 — Analytics**
Status: Plausible integration planned, not built

**GAP 14 — Creative lab tools (Layer 1)**
Status: Vision defined, not built
Full AI-assisted concept generation for universes and doll briefs.

---

## BUILD SEQUENCE — THE EXACT ORDER

This is the sequence Claude and Claude Code will follow.
No phase opens until the previous phase is validated.

```
NOW — In progress
├── Provider routing fix (shared.js) — COMPLETE
├── API quality validation (Phase B) — BLOCKED: needs funded API key
└── Git: feature/refactor-project-structure committed and pushed ✓

NEXT — Priority Layer 1

Phase U1 — Universe data model
  Supabase: universes table + doll foreign key
  Admin: universe management UI (create, edit)
  Admin: assign doll to universe
  Gate: at least one real universe record exists before proceeding

Phase U2 — Universe AI injection
  Update UNIVERSE_BLOCK in guidelines.js to read from real universe data
  Update all prompt builders to pass universe data from doll record
  Gate: generate content for a doll with real universe data,
        confirm universe tone is reflected in output

Phase CB1 — Character brief fields
  Supabase: add extended fields to dolls table
  Admin: expand Character stage panel with brief fields + guidance text
  Gate: fill in brief fields for one real doll,
        generate content, confirm quality improvement

Phase CB2 — Character brief generator
  New AI task: character_brief
  Admin: brief generator panel in Character stage
  Gate: generate brief for one doll from sparse inputs,
        confirm output quality, pre-fills extended fields correctly

Phase SL1 — Story library data model
  Supabase: new stories table (universe-linked)
  Supabase: doll_stories junction table
  Migrate existing doll-level stories
  Gate: all existing story content preserved and accessible

Phase SL2 — Story builder UI (Phase 1)
  Template selection
  Element assembly modal
  AI-assisted refinement
  Preview and approval
  Publish and assign to dolls
  Gate: create one complete story for Farm World,
        assign to two dolls, confirm public experience displays correctly

Phase AL1 — Activity library
  Supabase: activities table
  Admin: activity builder (four initial types)
  Public experience: Activities scene
  Gate: create one activity for Farm World,
        confirm it appears on all Farm World doll pages with name personalization

Phase PP1 — Physical production tracking
  Supabase: production_orders table
  Admin: production board
  Quality check → check-in flow
  Gate: create one production order, move it through all statuses to check-in

THEN — Priority Layer 2

Phase OP1 — Roles and permissions
Phase OP2 — Review and approval workflow refinement

THEN — Priority Layer 3 (when first collaborator is ready)

Phase SM1 — Social media management layer
Phase MK1 — Marketing strategy session
Phase SH1 — Online shop (planning phase)
```

---

## THE DECISION BEFORE ANYTHING STARTS

**The feature/refactor-project-structure branch has not been merged to main.**

Before building anything new, a decision is needed:

Option A — Merge to main now
The refactored architecture becomes the stable base.
All new work builds on the feature branch merged to main.
Recommended if the system is stable and all smoke tests pass.

Option B — Continue on the feature branch
New work continues on the same branch.
Merge happens when the branch is considered production-ready.
Risk: the branch diverges further from main and merge becomes harder.

**Claude's recommendation: merge to main.**
The architecture is refactored, tested (254 tests), and smoke-checked.
The longer this stays on a branch, the harder the eventual merge.
Merge now, then create a new feature branch for Phase U1.

---

## OPEN ITEMS REQUIRING ACTION BEFORE NEXT BUILD SESSION

1. Funded Anthropic API key — required for Phase B quality validation
2. Branch merge decision — merge feature branch to main or continue on branch
3. ElevenLabs account — required for real voice generation (Phase C2 activation)
4. Confirm the 50 dolls universe assignment — which dolls go into which universe
   (Farm World, Little Dreamers, Together World) before Phase U1 starts

---

*Document owner: Claude (Strategic Lead) — Maille et Merveille*  
*Last updated: Session — March 2026*  
*Next review: After Phase U1 is complete*
