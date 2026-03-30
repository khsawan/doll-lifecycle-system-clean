# Maille wt Merveille — Doll Lifecycle System

## What This System Is
A production operating system for handmade dolls. It manages the full lifecycle from registration through content creation to public digital activation. Built for a single admin operator who creates, configures, and activates dolls. Each doll gets a digital identity: a story, a public experience page, a QR code, and commerce-ready status.

## Tech Stack
- **Next.js 15** App Router, **React 19**
- **Supabase** (PostgreSQL + RLS + Storage bucket: `doll-assets`)
- **AI**: Anthropic (Claude) + Google Gemini, switchable via `AI_PROVIDER` env var, with local/remote service modes
- **Vitest** for tests (254 passing)

## Architecture — 3 Layers

```
app/          → Thin Next.js routes. Delegates everything to features.
features/     → All business logic, split by domain:
                  admin/              Admin dashboard and management
                  public-experience/  Public-facing doll experience
                  production-pipeline/ Pipeline state machine
                  settings/           App-level settings
                  orchestrator/       Top-level workflow entry points
lib/          → Shared capabilities:
                  pipelineState.js    Pipeline model and rules
                  supabase.js         DB client
                  ai/                 AI capability boundary (providers, prompts, generation)
                  assets/             QR and image capability boundary
                  shared/contracts/   Service command/result primitives
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

## Key Data Model Rules
- `pipeline_state` (JSONB column) is the **source of truth** for pipeline progression
- Readiness is **separate** from progression — a stage can be open without being ready
- `commerce_status` is separate from order status
- Database tables: `dolls`, `stories`, `content_assets`, `orders`, `themes`, `app_settings`

## Coding Conventions
- **Checklist-first** — plan before implementing, one step at a time
- Changes must be **localized to the smallest responsible area**
- **No breaking changes** to existing functionality
- Prefer **additive and reversible** changes over risky rewrites
- After any pipeline/readiness/architecture change: **update `docs/DOLL_LIFECYCLE_SYSTEM.md`**
- Validate each step before moving to the next

## File Reference Guide

| What you need | Where to look |
|---------------|---------------|
| Pipeline logic and locking rules | `lib/pipelineState.js` |
| Admin orchestration | `features/admin/hooks/` |
| Admin business logic | `features/admin/domain/` |
| Public doll experience | `features/public-experience/` |
| AI generation workflows | `lib/ai/` + `features/orchestrator/application/` |
| Pipeline stage advancement | `features/production-pipeline/` |
| API route boundaries | `app/api/admin/*/route.js` |
| App settings / AI config | `features/settings/` |
| Service contracts | `lib/shared/contracts/` |
| Architecture overview | `docs/ARCHITECTURE_HANDOFF.md` |
| System spec and pipeline model | `docs/DOLL_LIFECYCLE_SYSTEM.md` |
| Workflow and change rules | `docs/WORKFLOW_RULES.md` |

## Current Branch
Active branch: `feature/refactor-project-structure`
A major structural refactor moved business logic from monolithic `page.js` files into feature modules under `features/`. The refactor is complete and all quality gates pass (lint, test, build, smoke). See `docs/ARCHITECTURE_HANDOFF.md` for the current state.
