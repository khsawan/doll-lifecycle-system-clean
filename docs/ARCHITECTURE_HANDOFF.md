# Architecture Handoff

## Purpose

This document is the current architecture handoff for the refactored Doll Lifecycle System.

Use it when:

- onboarding a new collaborator
- giving ChatGPT or another assistant the current project shape
- planning new feature work without reintroducing logic into route files
- continuing the refactor toward stronger service boundaries or eventual microservices

## Project Snapshot

- Stack: Next.js 15 app router, React 19, Supabase, Vitest, ESLint
- Current test status: `254` passing tests
- Verification status:
  - `npm run lint` passes
  - `npm run test` passes
  - `npm run build` passes
  - `npm run smoke:refactor` passes

The project has been heavily refactored away from large route files into feature-based modules.

## High-Level Architecture

### App Routes

Routes in `app/` are now intentionally thin composition layers.

- `app/page.js`
  Admin entry route. Handles route-level access gating and only mounts the authenticated admin shell after access is resolved.
- `app/settings/page.js`
  Settings route. Uses the same admin session model and settings feature modules.
- `app/doll/[slug]/page.js`
  Public doll experience route. Delegates page loading/state handling to feature modules.

### Feature Modules

Most business logic now lives under `features/`.

- `features/admin/`
  Admin application controllers, hooks, components, services, domain logic, constants, and styles.
- `features/public-experience/`
  Public doll route loading, experience mapping, shell orchestration, scene logic, audio logic, fixtures, and presentation.
- `features/production-pipeline/`
  Service-oriented production pipeline boundary extracted as a stepping stone toward eventual microservices.
- `features/settings/`
  Settings domain, persistence, API client, and UI composition.
- `features/orchestrator/`
  Top-level in-process application actions that coordinate multi-step capability workflows through stable internal entry points.

### Library Modules

`lib/` now holds lower-level shared primitives and compatibility shims rather than route-level orchestration.

- `lib/pipelineState.js`
  Canonical pipeline normalization and transition logic.
- `lib/publicExperience.js`
  Compatibility re-export to the public-experience mapper.
- `lib/supabase.js`
  Browser Supabase client wiring.
- `lib/ai/*`
  AI capability boundary with explicit interface, application, domain, and infrastructure layers plus compatibility shims.
- `lib/assets/*`
  Media and asset capability boundary with explicit interface, application, domain, and infrastructure layers plus compatibility-ready in-process service adapters.
- `lib/shared/contracts/*`
  Shared internal command/result/error helpers used to keep service-style capability boundaries consistent inside the modular monolith.

## Admin Architecture

### Route Flow

The admin root route now works like this:

1. `app/page.js`
2. `features/admin/hooks/useAdminPageAccessController.js`
3. `features/admin/components/AdminRouteView.js`
4. `features/admin/components/AdminAuthenticatedShellLoader.js`
5. `features/admin/hooks/useAdminPageShellController.js`
6. `features/admin/hooks/useAdminAuthenticatedShellController.js`
7. `features/admin/components/AdminAuthenticatedShell.js`

### Auth Model

Admin auth is no longer browser-only password gating.

- Session endpoint: `app/api/admin/session/route.js`
- Session domain: `features/admin/domain/session.js`
- Access hook: `features/admin/hooks/useAdminAccess.js`

The app now uses a signed admin session cookie. The admin shell is mounted only after auth is resolved. The session check also has a timeout fallback so the app does not remain indefinitely stuck on `Checking admin access...`.

### Controller Layer

The large admin route/controller tree has been split into focused controllers.

Important orchestration seams:

- `features/admin/hooks/useAdminPageController.js`
- `features/admin/hooks/useAdminPageAccessController.js`
- `features/admin/hooks/useAdminPageShellController.js`
- `features/admin/hooks/useAdminAuthenticatedShellController.js`
- `features/admin/hooks/useAdminShellCompositionController.js`
- `features/admin/hooks/useAdminWorkspaceShellController.js`
- `features/admin/hooks/useAdminEditorActionShellController.js`

Selected workspace flow:

- `features/admin/hooks/useAdminSelectedWorkspaceController.js`
- `features/admin/hooks/useAdminCatalogWorkspaceController.js`
- `features/admin/hooks/useAdminDetailWorkspaceController.js`
- `features/admin/hooks/useAdminWorkspaceViewController.js`

Editor flow:

- `features/admin/hooks/useAdminEditorController.js`
- `features/admin/hooks/useAdminContentEditorController.js`
- `features/admin/hooks/useAdminManagedContentCommerceController.js`

Action flow:

- `features/admin/hooks/useAdminActionController.js`
- `features/admin/hooks/useAdminPipelineActionController.js`
- `features/admin/hooks/useAdminQrActionController.js`
- `features/admin/hooks/useAdminDangerActionController.js`
- `features/admin/hooks/useAdminActionResetController.js`

### Domain / State Builders

The admin shell is now driven by extracted domain logic rather than large inline route derivations.

Important domain modules:

- `features/admin/domain/shellState.js`
- `features/admin/domain/workspaceView.js`
- `features/admin/domain/workflow.js`
- `features/admin/domain/operations.js`
- `features/admin/domain/content.js`
- `features/admin/domain/detailState.js`
- `features/admin/domain/publicLinks.js`
- `features/admin/domain/access.js`

### Protected Admin APIs

Admin write/read flows now go through protected server endpoints.

Key routes:

- `app/api/admin/session/route.js`
- `app/api/admin/catalog/route.js`
- `app/api/admin/settings/route.js`
- `app/api/admin/dolls/[id]/route.js`
- `app/api/admin/dolls/[id]/detail/route.js`
- `app/api/admin/dolls/[id]/story/route.js`
- `app/api/admin/dolls/[id]/content-pack/route.js`
- `app/api/admin/dolls/[id]/order/route.js`
- `app/api/admin/dolls/[id]/image/route.js`
- `app/api/admin/dolls/[id]/qr/route.js`
- `app/api/admin/dolls/[id]/pipeline-state/route.js`
- `app/api/ai/generate/route.js`

Client-facing API adapters live in:

- `features/admin/services/catalogApi.js`
- `features/admin/services/detailApi.js`
- `features/admin/services/dollApi.js`
- `features/admin/services/assetApi.js`
- `features/admin/services/pipelineApi.js`
- `features/admin/services/ai.js`

Server-side store/data adapters live in:

- `features/admin/services/store.js`
- `features/admin/services/dolls.js`
- `features/admin/services/themes.js`
- `features/admin/services/stories.js`
- `features/admin/services/contentAssets.js`
- `features/admin/services/orders.js`
- `features/admin/services/qr.js`

## Public Experience Architecture

### Route Flow

The public doll route now works like this:

1. `app/doll/[slug]/page.js`
2. `features/public-experience/hooks/usePublicExperiencePageController.js`
3. `features/public-experience/components/PublicExperienceRouteView.js`
4. `app/doll/[slug]/V1ExperienceShell.js`
5. `features/public-experience/hooks/usePublicExperienceShellController.js`

### Public Experience Modules

Page/data loading:

- `features/public-experience/services/experience.js`
- `features/public-experience/hooks/usePublicExperiencePageController.js`

Experience mapping:

- `features/public-experience/mappers/buildExperience.js`
- `features/public-experience/fixtures/rosie.js`

Shell orchestration:

- `features/public-experience/hooks/usePublicExperienceShellController.js`
- `features/public-experience/hooks/usePublicExperienceSceneController.js`
- `features/public-experience/hooks/usePublicExperienceAudioController.js`

Lower-level public hooks:

- `features/public-experience/hooks/usePublicSceneNavigation.js`
- `features/public-experience/hooks/usePublicAmbientAudio.js`
- `features/public-experience/hooks/usePublicAudioTrack.js`
- `features/public-experience/hooks/usePublicStoryNarration.js`

Public domain helpers:

- `features/public-experience/domain/runtime.js`
- `features/public-experience/domain/navigation.js`
- `features/public-experience/domain/audio.js`

## Production Pipeline Architecture

The production pipeline has been separated into service-style modules so it can evolve toward microservices cleanly.

The app now also has a shared internal service-contract layer under `lib/shared/contracts/*`.

- It defines lightweight command envelopes plus normalized success/failure results.
- It is architecture preparation for future capability extraction, not a distributed deployment change.
- Early low-risk adoption points now exist in the production pipeline, protected AI generation path, and selected admin API adapters.

### Current Structure

- `features/production-pipeline/domain/commands.js`
  Pure command policy for stage completion/reopen behavior and warnings.
- `features/production-pipeline/services/recordSync.js`
  Applies successful pipeline results back into record collections.
- `features/production-pipeline/services/commandExecutor.js`
  Persists a command, syncs records, and publishes success/error feedback.
- `features/production-pipeline/services/store.js`
  Store persistence adapter for pipeline state writes.
- `features/production-pipeline/hooks/useProductionPipelineOrchestrator.js`
  Central in-process orchestrator that coordinates the above modules.

### Admin Integration

Admin no longer owns the full pipeline workflow directly.

- `features/admin/hooks/useAdminPipelineActions.js`
  Thin admin adapter into the shared production-pipeline orchestrator.
- `features/admin/hooks/useAdminPipelineActionController.js`
  Exposes pipeline actions into the broader admin action layer.

### Microservice Direction

The app is not a distributed microservice system yet. It is still a modular monolith.

However, the production-pipeline area now has the right separation for future extraction:

- policy layer
- orchestration layer
- persistence layer
- record synchronization layer

That means later work can replace the in-process persistence and execution adapters with networked service boundaries without rewriting the whole admin UI contract.

## Application Orchestrator

The app now has a top-level in-process application orchestrator layer under `features/orchestrator/`.

- `features/orchestrator/application/generateStory.js`
- `features/orchestrator/application/generateContentPack.js`
- `features/orchestrator/application/generateSocial.js`
- `features/orchestrator/application/generateQr.js`
- `features/orchestrator/application/advancePipelineStage.js`

This layer is intentionally a coordinator, not a new domain home.

- It uses `lib/shared/contracts/*` internally for command/result/error normalization.
- It reuses existing AI, media/asset, and production-pipeline services rather than duplicating their domain rules.
- It keeps current outward route and admin-service behavior backward-compatible while creating stable application-level workflow entry points for future extraction.

## Settings and AI

Settings are now their own feature path and shared store boundary.

Important files:

- `features/settings/domain/settings.js`
- `features/settings/services/settingsStore.js`
- `features/settings/services/settingsApi.js`
- `features/settings/hooks/useAdminSettings.js`
- `features/settings/components/SettingsPageContent.js`
- `app/settings/page.js`

AI generation now uses shared settings and protected admin APIs.

Important files:

- `app/api/ai/generate/route.js`
- `apps/ai-service/lib/http.js`
- `apps/ai-service/server.mjs`
- `lib/ai/interface/requests.js`
- `lib/ai/interface/responses.js`
- `lib/ai/interface/errors.js`
- `lib/ai/interface/config.js`
- `lib/ai/interface/remote.js`
- `lib/ai/interface/factory.js`
- `lib/ai/interface/service.js`
- `lib/ai/interface/trace.js`
- `lib/ai/application/generateStory.js`
- `lib/ai/application/generateContentPack.js`
- `lib/ai/application/generateSocial.js`
- `lib/ai/domain/requests.js`
- `lib/ai/domain/results.js`
- `lib/ai/domain/taskRouting.js`
- `lib/ai/infrastructure/runtime.js`
- `lib/ai/infrastructure/providers.js`
- `lib/ai/infrastructure/prompts.js`
- `lib/ai/infrastructure/settings.js`
- `lib/ai/index.js`
- `lib/ai/normalize.js`
- `lib/ai/guidelines.js`
- `lib/ai/providers/anthropic.js`
- `lib/ai/prompts/story.js`
- `lib/ai/prompts/contentPack.js`
- `lib/ai/prompts/social.js`
- `lib/ai/prompts/v1Content.js`

The top-level application orchestrator continues to own workflow entry points, while the AI capability now exposes both:

- a local in-process adapter in `lib/ai/interface/service.js`
- a remote HTTP adapter in `lib/ai/interface/remote.js`

Adapter selection now goes through `lib/ai/interface/factory.js`, driven by:

- `AI_SERVICE_MODE=local|remote`
- `AI_SERVICE_BASE_URL=...`
- `AI_SERVICE_TIMEOUT_MS=...`
- `AI_SERVICE_ALLOW_LOCAL_FALLBACK=true|false`

Story, Content Pack, and Social generation can now be routed through the isolated `apps/ai-service` HTTP service without changing orchestrator callers or the protected `/api/ai/generate` route contract. The protected AI route still returns backward-compatible payloads for current admin callers, and remote rollout can be reversed immediately by switching back to `AI_SERVICE_MODE=local`.

## Media / Assets

Media and asset operations now follow the same service-ready extraction pattern as AI while staying in-process.

Important files:

- `lib/assets/interface/requests.js`
- `lib/assets/interface/responses.js`
- `lib/assets/interface/errors.js`
- `lib/assets/interface/service.js`
- `lib/assets/interface/trace.js`
- `lib/assets/interface/transport.js`
- `lib/assets/application/generateQr.js`
- `lib/assets/application/uploadImage.js`
- `lib/assets/domain/assetKinds.js`
- `lib/assets/domain/requests.js`
- `lib/assets/domain/results.js`
- `lib/assets/domain/publicAssetContext.js`
- `lib/assets/infrastructure/qr.js`
- `lib/assets/infrastructure/storage.js`
- `lib/assets/infrastructure/dolls.js`
- `lib/assets/infrastructure/publicLinks.js`
- `app/api/admin/dolls/[id]/qr/route.js`
- `app/api/admin/dolls/[id]/image/route.js`

The QR workflow entry point in `features/orchestrator/application/generateQr.js` now delegates to the extracted asset service boundary, and the protected image upload route also uses that same in-process interface. Request IDs, trace metadata, stable asset error codes, and public-link-related metadata now have a stable internal boundary without changing the outward admin route payloads.

## Environment Notes

Current `.env.local` shape includes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_ADMIN_PASSWORD`

It does not currently include:

- `SUPABASE_SERVICE_ROLE_KEY`

This matters because some server-side admin store paths will fall back to the publishable key if the service role key is absent. That may be acceptable for some reads, but it is an architectural gap to remember when diagnosing privileged server access or RLS-sensitive failures.

## Recent Stability Fixes

Recent important fixes after the large refactor:

- Catalog error state now clears correctly after a later successful reload.
- Admin root route no longer mounts the heavy authenticated shell before access is resolved.
- Admin session boot has a timeout fallback so refreshes do not remain indefinitely stuck on `Checking admin access...`.

## Remaining Non-Code Follow-up

The main remaining follow-up is manual browser QA.

See:

- `docs/REFACTOR_SMOKE_CHECKLIST.md`

Important manual areas:

- admin login/logout
- catalog load/create/select
- editor save flows
- QR flow
- public doll route flow
- settings save flow

## Guidance For Future Changes

- Keep route files thin.
- Put business logic in `features/*`, not back in `app/*`.
- Prefer pure domain modules before component-level changes when extracting logic.
- When evolving the production pipeline, preserve the current service boundaries rather than moving orchestration back into admin hooks.
- Treat `docs/PROJECT_REFACTOR_PLAN.md` as the detailed implementation history and `docs/ARCHITECTURE_HANDOFF.md` as the current-state orientation document.
