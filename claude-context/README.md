# Doll Lifecycle System

Internal operating system for Maille & Merveille.

## Current Refactor Status

The active refactor work is on `feature/refactor-project-structure`.

The large route-level admin and public experience logic has been split into:

- `features/admin/*` for admin components, hooks, services, domain helpers, and styles
- `features/public-experience/*` for public experience components, hooks, services, fixtures, and domain helpers
- `features/settings/*` for the authenticated admin settings flow, services, hooks, and presentation

See [docs/PROJECT_REFACTOR_PLAN.md](docs/PROJECT_REFACTOR_PLAN.md) for the running slice log and current status.

## Environment variables

Add these in Vercel or `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, server-only, preferred for protected admin settings, catalog, and AI runtime settings access)
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `AI_SERVICE_MODE` (`local` or `remote`, defaults to `local`)
- `AI_SERVICE_BASE_URL` (required when `AI_SERVICE_MODE=remote`)
- `AI_SERVICE_TIMEOUT_MS` (optional)
- `AI_SERVICE_ALLOW_LOCAL_FALLBACK` (`true` only if you want remote mode to fall back to local execution)

Backward-compatible fallback:

- `NEXT_PUBLIC_ADMIN_PASSWORD`

## Run locally

```bash
npm install
npm run dev
```

Optional extracted AI service:

```bash
npm run ai-service:start
```

Use `AI_SERVICE_MODE=remote` plus `AI_SERVICE_BASE_URL=http://127.0.0.1:4100` to route Story / Content Pack / Social generation through the isolated AI service while keeping the protected `/api/ai/generate` route and current admin payloads unchanged.

## Quality Gates

```bash
npm run lint
npm run test
npm run build
npm run smoke:refactor
```

`npm run smoke:refactor` is a repeatable headless smoke pass that validates:

- `/`
- `/settings`
- `/api/admin/session`
- `/api/admin/settings`
- `/api/admin/catalog`
- `/api/admin/dolls/[id]`
- `/api/admin/dolls/[id]/image`
- `/api/admin/dolls/[id]/qr`
- `/api/admin/dolls/[id]/pipeline-state`
- `/api/admin/dolls/[id]/detail`
- `/api/admin/dolls/[id]/story`
- `/api/admin/dolls/[id]/content-pack`
- `/api/admin/dolls/[id]/order`
- `/doll/[valid-slug]`
- `/doll/[invalid-slug]`

## Remaining Manual QA

The branch is covered by lint, tests, build, and headless smoke checks, but it still needs a real browser click-through for:

- admin login/logout
- create/edit/save flows
- QR preview/download behavior
- public scene navigation and audio controls

Use [docs/REFACTOR_SMOKE_CHECKLIST.md](docs/REFACTOR_SMOKE_CHECKLIST.md) for the manual pass.
