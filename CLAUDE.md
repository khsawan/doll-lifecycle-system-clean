# Maille et Merveille — Doll Lifecycle System

## Read These First
Before making any change, read these documents in order:
1. `docs/VISION_DOCUMENT.md` — business and product vision
2. `docs/WORKFLOW_RULES.md` — how changes must be made
3. `docs/DOLL_LIFECYCLE_SYSTEM.md` — system spec and pipeline model
4. `docs/ARCHITECTURE_HANDOFF.md` — current technical architecture
5. `docs/GAP_ANALYSIS_AND_ROADMAP.md` — what is built and what comes next

## What This System Is
A production operating system for handmade story-driven dolls.
Manages the full lifecycle from creative concept through physical production,
digital activation, social media, commerce, and archiving.

The universe is the living entity. The doll is the child's permanent passport
into that universe. Every architectural decision must support this principle.

## Current Branch
`main` — stable, all quality gates passing

## Tech Stack
- Next.js 15 App Router, React 19
- Supabase (PostgreSQL + RLS + Storage bucket: doll-assets)
- AI: Anthropic Claude + Google Gemini, switchable via AI_PROVIDER env var
- AI microservice: apps/ai-service (standalone Node service)
- Vitest — 254 passing tests
- Vercel — deployment

## Architecture

```
app/          → Thin Next.js routes only
features/     → All business logic by domain
  admin/               Admin dashboard and management
  public-experience/   Public-facing doll experience
  production-pipeline/ Pipeline state machine
  settings/            App-level settings
  orchestrator/        Top-level workflow entry points
lib/          → Shared capabilities
  pipelineState.js     Pipeline model and rules
  supabase.js          DB client
  ai/                  AI capability boundary
  assets/              QR and image capability boundary
  shared/contracts/    Service command/result primitives
apps/         → Standalone services
  ai-service/          Standalone AI HTTP microservice
scripts/      → Utility scripts
  updateTimeline.mjs   Timeline updater — run after every phase
```

Within each feature: components/ → hooks/ → services/ → domain/

## Three Active Universes
- Farm World — Warmth, earthy, nurturing
- Little Dreamers — Grace, creativity, expression
- Together World — Belonging, friendship, joy

## Production Pipeline — 5 Stages
Registered → Character → Content → Gateway → Ready
One stage active at a time. Stage lock system enforced.
pipeline_state (JSONB) is the source of truth.

## What Is Built
- Five-stage pipeline with stage lock system
- Prompt injection system (lib/ai/guidelines.js)
- Content management persistence (generation/review/publish)
- Public experience with full audio system
- Content variation engine (2-3 options per generation)
- Ambient animations (C1 complete)
- AI microservice with Google + Anthropic support
- Protected admin APIs
- Architectural refactor — 254 passing tests

## What Is NOT Built (build in this order)
1. Universe layer — Phase U1/U2 (NEXT)
2. Character brief fields — Phase CB1/CB2
3. Story library + builder — Phase SL1/SL2
4. Activity library — Phase AL1
5. Physical production tracking — Phase PP1
6. Roles and permissions — Phase OP1
7. Living universe (Friends and Tales) — Phase LU1
8. Social media layer — Phase SM1
9. Online shop — Phase SH1

## Non-Negotiable Rules
- One step at a time — never combine steps
- No breaking changes to existing functionality
- Additive and reversible changes only
- Never touch: pipeline_state logic, commerce_status logic,
  lib/ai/normalize.js without explicit instruction
- After every pipeline/architecture change: update docs/DOLL_LIFECYCLE_SYSTEM.md
- After every completed phase: run node scripts/updateTimeline.mjs
- Validate before proceeding to next step

## File Reference
| Need | Location |
|---|---|
| Vision and product decisions | docs/VISION_DOCUMENT.md |
| Pipeline logic | lib/pipelineState.js |
| Admin hooks/controllers | features/admin/hooks/ |
| Admin domain logic | features/admin/domain/ |
| Public experience | features/public-experience/ |
| AI generation | lib/ai/ + features/orchestrator/application/ |
| Pipeline advancement | features/production-pipeline/ |
| API boundaries | app/api/admin/*/route.js |
| AI config/settings | features/settings/ |
| Service contracts | lib/shared/contracts/ |
| Brand voice + prompt rules | docs/CONTENT_GUIDELINES.md |
| Build roadmap | docs/GAP_ANALYSIS_AND_ROADMAP.md |
| Project timeline | docs/PROJECT_TIMELINE.md |

## Validation Format
After every step, report using this exact format:
1. Files modified → list them
2. Files created → list them
3. No existing functionality broken → Yes/No
4. Tests still passing → Yes/No (run npm test)
5. Ready for next step → Yes/No

## Phase Completion
When a phase is complete and validated, run:
node scripts/updateTimeline.mjs --phase <id> --status done --weeks <actual> --note "<what was built>"
Then commit:
git add docs/PROJECT_TIMELINE.md
git commit -m "Timeline: <phase name> complete"

## Current Next Phase
Phase U1 — Universe data model
Technical specification provided by Claude (claude.ai project).
Wait for spec before starting any work.
