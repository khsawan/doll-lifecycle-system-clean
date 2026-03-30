# Claude Context Bundle — Maille wt Merveille

This folder contains the curated project files for giving Claude full context of the Doll Lifecycle System.

## How to use this bundle

### Step 1 — Set Project Instructions
Open your Claude Project → **Instructions**.
Copy and paste the full contents of `CLAUDE_PROJECT_INSTRUCTIONS.md` into the instructions field.

### Step 2 — Upload Project Knowledge files
Upload all other files in this folder to Claude Project → **Add content**.
Preserve subdirectory structure where possible, or upload flat — Claude will still index the content.

### Recommended upload order (highest signal first)
1. `docs/ARCHITECTURE_HANDOFF.md`
2. `docs/DOLL_LIFECYCLE_SYSTEM.md`
3. `docs/WORKFLOW_RULES.md`
4. `docs/PROJECT_REFACTOR_PLAN.md`
5. `docs/CONTENT_GUIDELINES.md`
6. `package.json` + config files
7. Route entry files under `app/`
8. Feature controllers/hooks/services under `features/`
9. Shared lib modules under `lib/`
10. Protected API routes under `app/api/`

## What is included
- Architecture and system design docs
- Workflow and coding rules
- Config and environment reference
- Admin domain, hooks, services, and shell components
- Public experience hooks, mappers, and domain
- Production pipeline orchestration
- AI capability boundary (providers, prompts, generation)
- Settings management
- App route entry points and API boundaries

## What is intentionally excluded
- `.env.local` and any secret-bearing files
- `node_modules/`, `.next/`, temp logs, and generated artifacts
- All 28 admin UI leaf components (context overhead without architecture signal)
- Full test suite (useful for verification, not for architecture handoff)
- Lock file (`package-lock.json`)

The full file list is in `FILE_LIST.md`.
