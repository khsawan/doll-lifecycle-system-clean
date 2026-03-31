# Maille et Merveille — Doll Lifecycle System

## What This System Is
A production operating system for handmade story-driven dolls. It manages the full lifecycle from creative concept through physical production, digital activation, social media, commerce, and archiving. Built for a founder-operator who creates, configures, and activates dolls — with a roadmap to hand off to collaborators.

Each doll gets a complete digital identity: a character, a voice, a universe, stories, activities, a public experience page, and a QR code that links the physical doll to its living digital world.

## The Vision
The universe is the living entity. The doll is the child's permanent passport into that universe. Universes grow over time — new dolls, stories, and activities appear automatically on every doll page in that universe. A sold doll never expires. Her world just keeps getting richer.

Read `docs/VISION_DOCUMENT.md` for the full business and product vision.

## Tech Stack
- **Next.js 15** App Router, **React 19**
- **Supabase** (PostgreSQL + RLS + Storage bucket: `doll-assets`)
- **AI**: Anthropic (Claude) + Google Gemini, switchable via `AI_PROVIDER` env var
- **AI microservice**: `apps/ai-service` — standalone Node service, local/remote modes
- **Vitest** — 254 passing tests
- **Vercel** — deployment

## Architecture — 3 Layers

```
app/          → Thin Next.js routes. Delegates everything to features.
features/     → All business logic, split by domain:
                  admin/               Admin dashboard and management
                  public-experience/   Public-facing doll experience
                  production-pipeline/ Pipeline state machine
                  settings/            App-level settings
                  orchestrator/        Top-level workflow entry points
lib/          → Shared capabilities:
                  pipelineState.js     Pipeline model and rules
                  supabase.js          DB client
                  ai/                  AI capability boundary
                  assets/              QR and image capability boundary
                  shared/contracts/    Service command/result primitives
apps/         → Standalone services:
                  ai-service/          Standalone AI HTTP microservice
scripts/      → Utility scripts:
                  updateTimeline.mjs   Automatic project timeline updater
```

Within each feature: `components/` → `hooks/` (controllers) → `services/` (external calls) → `domain/` (pure business logic).

## Production Pipeline — 5 Stages
One stage is active at a time. Completing a stage unlocks the next. Reopening a stage locks all downstream stages.

| Stage | Meaning |
|-------|---------|
| **Registered** | Doll exists in system |
| **Character** | Identity, name, personality defined |
| **Content** | Story and content assets created |
| **Gateway** | Digital activation — QR code and public link ready |
| **Ready** | Fully validated, production-ready for commerce |

## Three Active Universes
| Universe | Emotional core |
|---|---|
| Farm World | Warmth — earthy, nurturing, grounding |
| Little Dreamers | Grace — creativity, expression, poetic |
| Together World | Belonging — friendship, first bonds, joy |

## Key Data Model Rules
- `pipeline_state` (JSONB) is the source of truth for pipeline progression
- Readiness is separate from progression
- `commerce_status` is separate from order status
- `audio_urls` (JSONB) stores layered audio: voice, ambient, scene
- Content access scope: universe / character match / assigned / exclusive
- Database tables: `dolls`, `stories`, `content_assets`, `orders`, `themes`, `app_settings`, `universes` (planned)

## What Is Built
- Five-stage production pipeline with stage lock system
- Prompt injection system (guidelines.js + all four prompt builders)
- Content management persistence (generation/review/publish status)
- Public experience with full audio system (voice, ambient, scene-level)
- Content variation engine (2–3 options per generation)
- Ambient animations (particles, breathing, entrance, hover)
- AI microservice with Google and Anthropic provider support
- Protected admin APIs (session, catalog, doll, pipeline, story, content, QR, image)
- Architectural refactor — feature modules, 254 passing tests

## What Is Not Yet Built (Next Phases)
- Universe layer — data model, admin UI, doll assignment (Phase U1 — next)
- Character brief extended fields in admin UI (Phase CB1)
- Story builder — template system, publishing lifecycle (Phase SL1/SL2)
- Activity library and Activities scene (Phase AL1)
- Physical production tracking (Phase PP1)
- Roles and permissions for collaborators (Phase OP1)
- Living universe — Friends & Tales scene, new arrivals, content scope (Phase LU1)
- Social media management layer (Phase SM1)
- Online shop (Phase SH1)

## Coding Conventions
- **Checklist-first** — plan before implementing, one step at a time
- Changes must be **localized to the smallest responsible area**
- **No breaking changes** to existing functionality
- Prefer **additive and reversible** changes over risky rewrites
- After any pipeline/readiness/architecture change: update `docs/DOLL_LIFECYCLE_SYSTEM.md`
- Validate each step before moving to the next
- After each completed phase: run `node scripts/updateTimeline.mjs --phase <id> --status done`

## File Reference Guide

| What you need | Where to look |
|---|---|
| Business + product vision | `docs/VISION_DOCUMENT.md` |
| System spec and pipeline model | `docs/DOLL_LIFECYCLE_SYSTEM.md` |
| Architecture overview | `docs/ARCHITECTURE_HANDOFF.md` |
| Brand voice + AI prompt rules | `docs/CONTENT_GUIDELINES.md` |
| Gap analysis + build roadmap | `docs/GAP_ANALYSIS_AND_ROADMAP.md` |
| Project timeline | `docs/PROJECT_TIMELINE.md` |
| Workflow and change rules | `docs/WORKFLOW_RULES.md` |
| Pipeline logic and locking rules | `lib/pipelineState.js` |
| Admin orchestration | `features/admin/hooks/` |
| Admin business logic | `features/admin/domain/` |
| Public doll experience | `features/public-experience/` |
| AI generation workflows | `lib/ai/` + `features/orchestrator/application/` |
| Pipeline stage advancement | `features/production-pipeline/` |
| API route boundaries | `app/api/admin/*/route.js` |
| App settings / AI config | `features/settings/` |
| Service contracts | `lib/shared/contracts/` |
| AI microservice | `apps/ai-service/` |
| Timeline updater | `scripts/updateTimeline.mjs` |

## Current Branch
Active branch: `main`
The architectural refactor is complete and merged to main. All quality gates pass (lint, test, build, smoke). The next phase is Phase U1 — Universe data model.

## AI Tool Roles
| Tool | Role |
|---|---|
| Claude (this project) | Strategic lead, architecture decisions, specs, validation |
| ChatGPT | Planning, Codex prompt writing, session continuity |
| Claude Code | Direct development — reads specs, builds, validates |
| Codex | Junior developer — executes ChatGPT-prepared prompts |
| Founder | Coordinator, visual tester, go/no-go decisions |

## Important Rules for Any AI Taking Over
1. Read `docs/VISION_DOCUMENT.md` before making any product decision
2. Read `docs/WORKFLOW_RULES.md` before making any code change
3. Read `docs/DOLL_LIFECYCLE_SYSTEM.md` before any pipeline or architecture change
4. One step at a time — validate before proceeding
5. No breaking changes — additive and reversible only
6. After phase completion — run the timeline update script
7. The universe is the living entity — every architectural decision must support this principle
