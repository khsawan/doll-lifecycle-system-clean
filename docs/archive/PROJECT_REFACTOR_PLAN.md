# Project Refactor Plan

## Branch

- Working branch: `feature/refactor-project-structure`

## Current State Snapshot

The app works and the production build currently succeeds, but the codebase is carrying a lot of implementation detail in route files.

Observed hotspots:

- `app/page.js` is `7,744` lines long.
- `app/page.js` currently contains `57` `useState` calls and `8` `useEffect` calls.
- `app/page.js` mixes route rendering, UI state, domain rules, Supabase reads/writes, AI calls, QR generation, clipboard behavior, local auth, and a large inline style system.
- `app/page.js` contains roughly `189` style constants/style factory functions.
- `app/doll/[slug]/V1ExperienceShell.js` is `1,469` lines and mixes scene navigation, theme resolution, animation, and audio orchestration.
- No test suite was detected.
- `npm.cmd run build` succeeds.
- `npm.cmd run lint` does not currently run automatically because ESLint is not configured yet and Next prompts interactively.

Architecture risks already visible in the current code:

- `app/doll/[slug]/page.js` fetches real `storyRows` but then renders hard-coded `testStoryRows`, which means runtime behavior is partially driven by temporary fixture data instead of source data.
- `lib/publicExperience.js` contains special-case product logic for `rosie`, which is a useful demo shortcut but not a scalable domain model.
- Admin protection is client-side in `app/page.js` using `localStorage` and a browser-available password comparison, which should be treated as temporary protection rather than real authentication.

## Refactor Goals

- Preserve current behavior while reducing blast radius for future changes.
- Separate route code from domain logic, data access, and UI composition.
- Make the admin app testable in smaller pieces.
- Remove temporary/demo paths from production flows.
- Establish basic quality gates so future refactors can move safely.

## Guiding Principles

- Keep route files thin.
- Move pure logic before moving JSX.
- Prefer small, behavior-preserving extractions over one big rewrite.
- Keep database contracts stable during early phases.
- Add safety nets before broad structural moves.
- Refactor by vertical slices, not by renaming folders only.

## Execution Status

Completed slices:

- Phase 0 baseline is in place:
  - ESLint runs non-interactively
  - Vitest is configured
  - smoke checklist is documented
- Phase 1 pure extraction is underway and already delivered:
  - admin content constants/helpers moved into `features/admin/constants/content.js`
  - admin workflow/operations helpers moved into `features/admin/constants/workflow.js`, `features/admin/domain/workflow.js`, and `features/admin/domain/operations.js`
  - unit tests cover the extracted pure helpers
- Phase 2 data-access extraction has started on the read side:
  - theme loading now goes through `features/admin/services/themes.js`
  - doll/detail loading now goes through `features/admin/services/dolls.js`
  - detail editor state assembly now goes through `features/admin/domain/detailState.js`
- Phase 2 write-side extraction is now underway:
  - AI generation requests now go through `features/admin/services/ai.js`
  - story saves now go through `features/admin/services/stories.js`
  - content-pack saves now go through `features/admin/services/contentAssets.js`
  - order saves now go through `features/admin/services/orders.js`
  - QR uploads now go through `features/admin/services/qr.js`
  - shared doll patch persistence now goes through `features/admin/services/dolls.js`
  - doll creation, pipeline persistence, image uploads, and permanent deletes now go through `features/admin/services/dolls.js`
- Phase 3 has started with the first route-orchestration hooks:
  - catalog loading and creation now go through `features/admin/hooks/useAdminCatalog.js`
  - workspace selection state now goes through `features/admin/hooks/useAdminWorkspaceSelection.js`
  - selected doll detail loading now goes through `features/admin/hooks/useAdminDetailState.js`
  - selected-doll transient reset behavior now goes through `features/admin/hooks/useAdminSelectionResets.js`
  - managed content editing and generation now go through `features/admin/hooks/useAdminManagedContent.js`
  - managed-content local state, derived selected content state, and optimistic status persistence now go through `features/admin/hooks/useAdminManagedContentState.js`
  - pipeline stage actions and warnings now go through `features/admin/hooks/useAdminPipelineActions.js`
  - QR workflow state and actions now go through `features/admin/hooks/useAdminQrWorkflow.js`
  - danger-zone archive and permanent-delete flows now go through `features/admin/hooks/useAdminDangerZone.js`
  - story editor generation, variation selection, and save flows now go through `features/admin/hooks/useAdminStoryEditor.js`
  - content-pack editor generation, variation selection, and save flows now go through `features/admin/hooks/useAdminContentPackEditor.js`
  - identity/social generation and shared identity save flows now go through `features/admin/hooks/useAdminIdentityEditor.js`
  - commerce status and order save flows now go through `features/admin/hooks/useAdminCommerceEditor.js`
  - order transition rules now live in `features/admin/domain/commerce.js`
  - image upload now goes through `features/admin/hooks/useAdminIdentityEditor.js`
  - admin access now goes through `features/admin/hooks/useAdminAccess.js`
  - browser-only copy/open helpers now go through `features/admin/hooks/useAdminBrowserActions.js`
- Phase 4 has now started with low-risk leaf component extraction:
  - auth screens now go through `features/admin/components/AdminAccessScreens.js`
  - the main admin page header now goes through `features/admin/components/AdminPageHeader.js`
  - repeated workflow feedback banners now go through `features/admin/components/AdminWorkflowFeedback.js`
  - the navigator/sidebar shell now goes through `features/admin/components/AdminNavigatorSidebar.js`
  - the selected-workspace header block now goes through `features/admin/components/AdminSelectedWorkspaceHeader.js`
  - the dashboard summary and next-step workspace panel now goes through `features/admin/components/AdminDashboardWorkspace.js`
  - the operations board container now goes through `features/admin/components/AdminOperationsBoard.js`
  - the selected-workspace wrapper panel now goes through `features/admin/components/AdminSelectedWorkspacePanel.js`
  - the pipeline workspace shell now goes through `features/admin/components/AdminPipelineWorkspace.js`
  - the content-studio workspace shell now goes through `features/admin/components/AdminContentStudioWorkspace.js`
  - the content-management overview/actions panel now goes through `features/admin/components/AdminContentManagementPanel.js`
  - the generated V1 content editor panel now goes through `features/admin/components/AdminGeneratedContentDraftEditor.js`
  - the overview summary panel now goes through `features/admin/components/AdminOverviewSummaryPanel.js`
  - the commerce and order panel now goes through `features/admin/components/AdminCommercePanel.js`
  - the danger-zone panel now goes through `features/admin/components/AdminDangerZonePanel.js`
  - the digital identity / QR panel now goes through `features/admin/components/AdminDigitalIdentityPanel.js`
  - the pipeline-boundary panel now goes through `features/admin/components/AdminPipelineBoundaryPanel.js`
  - the shared variation chooser now goes through `features/admin/components/AdminVariationPanel.js`
  - the story editor panel now goes through `features/admin/components/AdminStoryEditorPanel.js`
  - the content-pack editor panel now goes through `features/admin/components/AdminContentPackEditorPanel.js`
  - the social content editor panel now goes through `features/admin/components/AdminSocialContentPanel.js`
  - the production department panel now goes through `features/admin/components/AdminProductionPanel.js`
  - the character department panel now goes through `features/admin/components/AdminCharacterPanel.js`
  - the outer admin page shell now goes through `features/admin/components/AdminAppShell.js`
  - the stage reopen warning modal now goes through `features/admin/components/AdminStageActionWarningModal.js`
  - shared admin presentation primitives now go through `features/admin/styles/primitives.js`
  - shared variation panel styles now go through `features/admin/styles/variations.js`
  - workspace and content-studio style clusters now go through `features/admin/styles/workspaces.js`
  - operations board style clusters now go through `features/admin/styles/operations.js`
  - pipeline and workflow style clusters now go through `features/admin/styles/pipeline.js`
  - digital, danger-zone, identity-card, and print-card style clusters now go through `features/admin/styles/detailPanels.js`
- Shared admin AI payload builders now go through `features/admin/domain/generation.js`
- Shared workflow/content/dashboard/operations view selectors now go through `features/admin/domain/workspaceView.js`
- Shared admin runtime helpers now go through `features/admin/domain/runtime.js`
- Public doll experience loading now goes through `features/public-experience/services/experience.js`
- Rosie-specific public demo overrides now go through `features/public-experience/fixtures/rosie.js`
- Public doll loading and error states now go through `features/public-experience/components/PublicExperienceStateScreen.js`
- Public ambient route presentation now goes through `features/public-experience/components/PublicExperiencePageShell.js`
- Public shell top-bar controls now go through `features/public-experience/components/PublicExperienceTopBar.js`
- Public shell scene viewport now goes through `features/public-experience/components/PublicExperienceSceneViewport.js`
- Public shell scene navigation overlay now goes through `features/public-experience/components/PublicExperienceSceneNavigation.js`
- Public shell global presentation rules now go through `features/public-experience/components/PublicExperienceShellGlobalStyles.js`
- Public scene images now use `next/image` in `app/doll/[slug]/SceneWelcome.js`, `app/doll/[slug]/SceneStory.js`, and `app/doll/[slug]/SceneMeetFriends.js`
- Remaining admin image panels now use `next/image` in `features/admin/components/AdminDigitalIdentityPanel.js` and `features/admin/components/AdminProductionPanel.js`
- Public shell runtime selectors and audio source resolution now go through `features/public-experience/domain/runtime.js`
- Public scene transition state now goes through `features/public-experience/hooks/usePublicSceneNavigation.js`
- Public scene navigation guards now go through `features/public-experience/domain/navigation.js`
- Public audio track lifecycle now goes through `features/public-experience/hooks/usePublicAudioTrack.js`
- Public ambient audio side effects now go through `features/public-experience/hooks/usePublicAmbientAudio.js`
- Public story narration autoplay now goes through `features/public-experience/hooks/usePublicStoryNarration.js`
- Public audio guard helpers now go through `features/public-experience/domain/audio.js`
- Extracted content and generation helpers are covered by the expanded `tests/features/admin/domain/content.test.js` and `tests/features/admin/domain/generation.test.js`
- Extracted workspace view selectors are covered by `tests/features/admin/domain/workspaceView.test.js`
- Extracted runtime helpers are covered by `tests/features/admin/domain/runtime.test.js`
- Extracted public experience loading is covered by `tests/features/public-experience/services/experience.test.js`
- Extracted Rosie fixture behavior is covered by `tests/features/public-experience/fixtures/rosie.test.js`
- Extracted public runtime helpers are covered by `tests/features/public-experience/domain/runtime.test.js`
- Extracted public navigation helpers are covered by `tests/features/public-experience/domain/navigation.test.js`
- Extracted public audio helpers are covered by `tests/features/public-experience/domain/audio.test.js`
- Public shell loading, top-bar, navigation, and viewport rendering are covered by `tests/features/public-experience/components/shell.test.js`
- Vitest now parses the project's React `.js` files as JSX through `vitest.config.mjs`, so component coverage can exercise the extracted UI seams directly
- The last route-local content department style bundle now lives in `features/admin/styles/variations.js` and `features/admin/styles/workspaces.js`
- `app/page.js` no longer contains inline `style={{ ... }}` blocks; the route is down to orchestration and composition only
- Repeatable headless smoke coverage now lives in `scripts/refactorSmoke.mjs` and runs through `npm run smoke:refactor`
- The smoke command verifies a real Supabase-backed public slug, the invalid public slug path, the built `/`, `/settings`, and `/doll/[slug]` routes, plus the protected admin session/settings/catalog/doll/image/qr/pipeline/detail/story/content-pack/order endpoints
- Admin access state and login decisions now go through `features/admin/domain/access.js`
- Clipboard/new-tab guard decisions now go through `features/admin/domain/browserActions.js`
- Admin access and browser guard behavior are covered by `tests/features/admin/domain/access.test.js`, `tests/features/admin/domain/browserActions.test.js`, and `tests/features/admin/components/accessScreens.test.js`
- Merge handoff guidance now lives in `docs/REFACTOR_MERGE_READINESS.md`
- Admin login now goes through the server-backed `app/api/admin/session/route.js` endpoint
- Signed admin session helpers now go through `features/admin/domain/session.js`
- `app/page.js` no longer compares the admin password in the browser or uses `localStorage` as the login/session boundary
- Admin session signing and validation are covered by `tests/features/admin/domain/session.test.js`
- `/settings` now uses the same server-backed admin session flow before loading or saving admin-only settings
- `/api/ai/generate` now validates the signed admin session cookie before serving admin-only generation requests
- settings state/config now goes through `features/settings/domain/settings.js` and `features/settings/hooks/useAdminSettings.js`
- settings presentation now goes through `features/settings/components/SettingsPageContent.js`
- settings browser fetches now go through `features/settings/services/settingsApi.js`
- settings persistence now goes through the protected `app/api/admin/settings/route.js` endpoint and `features/settings/services/settingsStore.js`
- settings helper and service coverage now lives in `tests/features/settings/domain/settings.test.js`, `tests/features/settings/services/settingsApi.test.js`, and `tests/features/settings/services/settingsStore.test.js`
- AI runtime settings now load through the shared `features/settings/services/settingsStore.js` path instead of a separate `app_settings` lookup in `lib/ai/index.js`
- AI runtime settings resolution is covered by `tests/lib/ai/index.test.js`
- admin catalog fetch/create now goes through the protected `app/api/admin/catalog/route.js` endpoint and `features/admin/services/catalogApi.js`
- shared protected admin Supabase client config now goes through `features/admin/services/store.js`
- admin catalog API/store coverage now lives in `tests/features/admin/services/catalogApi.test.js` and `tests/features/admin/services/store.test.js`
- selected-doll detail reads now go through the protected `app/api/admin/dolls/[id]/detail/route.js` endpoint and `features/admin/services/detailApi.js`
- selected-doll detail API coverage now lives in `tests/features/admin/services/detailApi.test.js`
- selected-doll story/content-pack/order saves now go through protected `app/api/admin/dolls/[id]/story/route.js`, `app/api/admin/dolls/[id]/content-pack/route.js`, and `app/api/admin/dolls/[id]/order/route.js` endpoints plus `features/admin/services/detailApi.js`
- selected-doll row patch saves now go through the protected `app/api/admin/dolls/[id]/route.js` endpoint plus `features/admin/services/dollApi.js`
- selected-doll permanent delete now goes through the protected `DELETE app/api/admin/dolls/[id]/route.js` path plus `features/admin/services/dollApi.js`
- doll patch/delete API coverage now lives in `tests/features/admin/services/dollApi.test.js`
- selected-doll image and QR uploads now go through protected `app/api/admin/dolls/[id]/image/route.js` and `app/api/admin/dolls/[id]/qr/route.js` endpoints plus `features/admin/services/assetApi.js`
- asset upload API coverage now lives in `tests/features/admin/services/assetApi.test.js`
- pipeline stage persistence now goes through the protected `app/api/admin/dolls/[id]/pipeline-state/route.js` endpoint plus `features/admin/services/pipelineApi.js`
- pipeline API coverage now lives in `tests/features/admin/services/pipelineApi.test.js`
- selected workspace derivation now goes through `features/admin/hooks/useAdminWorkspaceView.js` and the expanded `features/admin/domain/workspaceView.js` helpers instead of living inline in `app/page.js`
- selected workspace view-model coverage now lives in `tests/features/admin/domain/workspaceView.test.js`
- authenticated admin shell composition now goes through `features/admin/components/AdminAuthenticatedShell.js` instead of staying inline in `app/page.js`
- authenticated shell content-section assembly and editor save-state rules now go through `features/admin/domain/content.js`
- content domain coverage now also checks the extracted content-section/save-state helpers
- authenticated shell state assembly now goes through `features/admin/hooks/useAdminAuthenticatedShellState.js` and `features/admin/domain/shellState.js`
- shell state coverage now lives in `tests/features/admin/domain/shellState.test.js`
- admin slug/public URL derivation now goes through `features/admin/hooks/useAdminPublicLinkState.js` and `features/admin/domain/publicLinks.js`
- public link coverage now lives in `tests/features/admin/domain/publicLinks.test.js`
- route-level admin page orchestration now goes through `features/admin/hooks/useAdminPageController.js`
- authenticated-shell orchestration now goes through `features/admin/hooks/useAdminAuthenticatedShellController.js`
- selected-workspace orchestration now goes through `features/admin/hooks/useAdminSelectedWorkspaceController.js`
- selected-workspace catalog/selection orchestration now goes through `features/admin/hooks/useAdminCatalogWorkspaceController.js`
- selected-workspace detail/public-link orchestration now goes through `features/admin/hooks/useAdminDetailWorkspaceController.js`
- selected-workspace view-state orchestration now goes through `features/admin/hooks/useAdminWorkspaceViewController.js`
- editor/content orchestration now goes through `features/admin/hooks/useAdminEditorController.js`
- content-editor orchestration now goes through `features/admin/hooks/useAdminContentEditorController.js`
- content-slice orchestration now goes through `features/admin/hooks/useAdminContentSliceController.js`
- content-section assembly now goes through `features/admin/hooks/useAdminContentSectionController.js`
- story/content orchestration now goes through `features/admin/hooks/useAdminStoryContentController.js`
- content-pack orchestration now goes through `features/admin/hooks/useAdminContentPackContentController.js`
- social-content orchestration now goes through `features/admin/hooks/useAdminSocialContentController.js`
- managed-content and commerce orchestration now goes through `features/admin/hooks/useAdminManagedContentCommerceController.js`
- commerce-editor orchestration now goes through `features/admin/hooks/useAdminCommerceEditorController.js`
- managed-content orchestration now goes through `features/admin/hooks/useAdminManagedContentController.js`
- catalog-data orchestration now goes through `features/admin/hooks/useAdminCatalogDataController.js`
- workspace filter/selection orchestration now goes through `features/admin/hooks/useAdminWorkspaceFilterSelectionController.js`
- page access orchestration now goes through `features/admin/hooks/useAdminPageAccessController.js`
- page shell orchestration now goes through `features/admin/hooks/useAdminPageShellController.js`
- detail-data orchestration now goes through `features/admin/hooks/useAdminDetailDataController.js`
- public-link orchestration now goes through `features/admin/hooks/useAdminPublicLinkController.js`
- workspace-view input assembly now goes through `features/admin/hooks/useAdminWorkspaceViewInputController.js`
- workspace-view state orchestration now goes through `features/admin/hooks/useAdminWorkspaceViewStateController.js`
- shell feedback/browser-state orchestration now goes through `features/admin/hooks/useAdminShellFeedbackController.js`
- shell grouped-controller composition now goes through `features/admin/hooks/useAdminShellCompositionController.js`
- shell workspace composition now goes through `features/admin/hooks/useAdminWorkspaceShellController.js`
- shell editor/action composition now goes through `features/admin/hooks/useAdminEditorActionShellController.js`
- workflow/danger orchestration now goes through `features/admin/hooks/useAdminActionController.js`
- pipeline action orchestration now goes through `features/admin/hooks/useAdminPipelineActionController.js`
- admin pipeline actions now go through `features/admin/hooks/useAdminPipelineActions.js` as a thin adapter over the standalone `features/production-pipeline/hooks/useProductionPipelineOrchestrator.js`
- production pipeline command policy now lives in `features/production-pipeline/domain/commands.js`
- production pipeline command execution and record sync now live in `features/production-pipeline/services/commandExecutor.js` and `features/production-pipeline/services/recordSync.js`
- production pipeline store persistence now goes through `features/production-pipeline/services/store.js`
- shared internal command/result/error contracts now live in `lib/shared/contracts/*`
- production pipeline commands now emit shared contract-shaped success/failure results and `AdvancePipelineStage` command envelopes
- protected AI generation plus admin pipeline/asset API adapters now understand the shared result/error shape while preserving backward-compatible behavior
- top-level in-process application actions now live in `features/orchestrator/application/*`
- story/content-pack/social generation, QR upload orchestration, and pipeline stage execution now have stable application-level entry points that reuse existing services/contracts underneath
- AI capability internals now live behind explicit `lib/ai/application/*`, `lib/ai/domain/*`, and `lib/ai/infrastructure/*` boundaries, and the orchestrator's Story/Content Pack/Social actions now delegate to those extracted AI application entry points
- AI capability now also exposes a transport-ready `lib/ai/interface/*` layer with DTO builders, stable AI error-code mapping, request/correlation metadata, and an in-process service adapter so future HTTP or async extraction can swap transport without reshaping current callers
- AI now has a real remote extraction path through `apps/ai-service/*`, a remote HTTP adapter in `lib/ai/interface/remote.js`, and config-driven adapter selection/fallback in `lib/ai/interface/factory.js`
- Story / Content Pack / Social generation can now switch between local and remote AI adapters through `AI_SERVICE_MODE`, with optional local fallback controlled explicitly by `AI_SERVICE_ALLOW_LOCAL_FALLBACK`
- media/asset capability now also lives behind explicit `lib/assets/application/*`, `lib/assets/domain/*`, `lib/assets/infrastructure/*`, and `lib/assets/interface/*` boundaries
- QR orchestration and the protected image/QR routes now delegate to that extracted asset service boundary while preserving the current admin caller payload shapes
- QR action orchestration now goes through `features/admin/hooks/useAdminQrActionController.js`
- danger action orchestration now goes through `features/admin/hooks/useAdminDangerActionController.js`
- action reset orchestration now goes through `features/admin/hooks/useAdminActionResetController.js`
- public route loading/state orchestration now goes through `features/public-experience/hooks/usePublicExperiencePageController.js` and `features/public-experience/components/PublicExperienceRouteView.js`
- public shell orchestration now goes through `features/public-experience/hooks/usePublicExperienceShellController.js`
- public scene orchestration now goes through `features/public-experience/hooks/usePublicExperienceSceneController.js`
- public audio orchestration now goes through `features/public-experience/hooks/usePublicExperienceAudioController.js`
- public experience mapping now goes through `features/public-experience/mappers/buildExperience.js`, and `lib/publicExperience.js` is now just a compatibility re-export
- route-level access-gate rendering now goes through `features/admin/components/AdminRouteView.js`
- route-view coverage now lives in `tests/features/admin/components/routeView.test.js`
- page-controller coverage now lives in `tests/features/admin/hooks/pageController.test.js`
- page access and page shell coverage now live in `tests/features/admin/hooks/pageAccessController.test.js` and `tests/features/admin/hooks/pageShellController.test.js`
- authenticated-shell and action-controller coverage now live in `tests/features/admin/hooks/authenticatedShellController.test.js` and `tests/features/admin/hooks/actionController.test.js`
- shell feedback and shell composition coverage now live in `tests/features/admin/hooks/shellFeedbackController.test.js` and `tests/features/admin/hooks/shellCompositionController.test.js`
- shell composition slice coverage now lives in `tests/features/admin/hooks/shellCompositionSlices.test.js`
- editor-controller and content-editor-controller coverage now live in `tests/features/admin/hooks/editorController.test.js` and `tests/features/admin/hooks/contentEditorController.test.js`
- content-slice and content-section coverage now live in `tests/features/admin/hooks/contentSliceController.test.js` and `tests/features/admin/hooks/contentSectionController.test.js`
- story/content-pack/social slice coverage now lives in `tests/features/admin/hooks/contentEditorSlices.test.js`
- pipeline/QR/danger slice coverage now lives in `tests/features/admin/hooks/actionSlices.test.js`
- admin pipeline adapter coverage now lives in `tests/features/admin/hooks/pipelineActions.test.js`
- action reset coverage now lives in `tests/features/admin/hooks/actionResetController.test.js`
- selected-workspace controller coverage now lives in `tests/features/admin/hooks/selectedWorkspaceController.test.js`
- selected-workspace slice coverage now lives in `tests/features/admin/hooks/selectedWorkspaceSlices.test.js`
- catalog-workspace slice coverage now lives in `tests/features/admin/hooks/catalogWorkspaceSlices.test.js`
- detail-workspace slice coverage now lives in `tests/features/admin/hooks/detailWorkspaceSlices.test.js`
- workspace-view slice coverage now lives in `tests/features/admin/hooks/workspaceViewSlices.test.js`
- managed-content/commerce controller coverage now lives in `tests/features/admin/hooks/managedContentCommerceController.test.js`
- managed-content/commerce slice coverage now lives in `tests/features/admin/hooks/managedContentCommerceSlices.test.js`
- public route-view coverage now lives in `tests/features/public-experience/components/routeView.test.js`
- public page-helper coverage now lives in `tests/features/public-experience/hooks/pageController.test.js`
- public shell-controller coverage now lives in `tests/features/public-experience/hooks/shellController.test.js`
- public shell-slice coverage now lives in `tests/features/public-experience/hooks/shellSlices.test.js`
- public experience mapper coverage now lives in `tests/features/public-experience/mappers/buildExperience.test.js`
- production pipeline command coverage now lives in `tests/features/production-pipeline/domain/commands.test.js`
- production pipeline service coverage now lives in `tests/features/production-pipeline/services/commandExecutor.test.js`, `tests/features/production-pipeline/services/recordSync.test.js`, and `tests/features/production-pipeline/services/store.test.js`
- operations board display-state derivation now goes through `features/admin/domain/operations.js`
- operations domain coverage now also checks the extracted operations board display-state helper
- QR print-card ref wiring now flows through the action controller into shell state, so the digital panel receives the same ref the QR workflow uses for print-card downloads
- `smoke:refactor` now verifies protected `PATCH` and `DELETE` access on `/api/admin/dolls/[id]`, plus `/api/admin/session`, `/api/admin/settings`, `/api/admin/catalog`, `/api/admin/dolls/[id]/image`, `/api/admin/dolls/[id]/qr`, `/api/admin/dolls/[id]/pipeline-state`, `/api/admin/dolls/[id]/detail`, and the protected story/content-pack/order mutation endpoints in addition to the admin/settings/public route checks

Current progress snapshot:

- `app/page.js` has been reduced from `7,744` lines to `30` lines.
- `app/doll/[slug]/page.js` is down to `14` lines and now hands off to `features/public-experience/hooks/usePublicExperiencePageController.js` plus `features/public-experience/components/PublicExperienceRouteView.js`.
- `app/doll/[slug]/V1ExperienceShell.js` has been reduced from `1,469` lines to `112` lines and now hands off to `features/public-experience/hooks/usePublicExperienceShellController.js`.
- `features/admin/hooks/useAdminPageController.js` is down to `19` lines and now composes `features/admin/hooks/useAdminPageAccessController.js` and `features/admin/hooks/useAdminPageShellController.js`.
- `features/admin/hooks/useAdminAuthenticatedShellController.js` is down to `49` lines and now composes `features/admin/hooks/useAdminShellFeedbackController.js` and `features/admin/hooks/useAdminShellCompositionController.js` before handing off to `features/admin/hooks/useAdminAuthenticatedShellState.js`.
- `features/admin/hooks/useAdminShellCompositionController.js` is down to `24` lines and now composes `features/admin/hooks/useAdminWorkspaceShellController.js` and `features/admin/hooks/useAdminEditorActionShellController.js`.
- `features/admin/hooks/useAdminSelectedWorkspaceController.js` is down to `36` lines and now composes `features/admin/hooks/useAdminCatalogWorkspaceController.js`, `features/admin/hooks/useAdminDetailWorkspaceController.js`, and `features/admin/hooks/useAdminWorkspaceViewController.js`.
- `features/admin/hooks/useAdminCatalogWorkspaceController.js` is down to `24` lines and now composes `features/admin/hooks/useAdminCatalogDataController.js` and `features/admin/hooks/useAdminWorkspaceFilterSelectionController.js`.
- `features/admin/hooks/useAdminDetailWorkspaceController.js` is down to `24` lines and now composes `features/admin/hooks/useAdminDetailDataController.js` and `features/admin/hooks/useAdminPublicLinkController.js`.
- `features/admin/hooks/useAdminWorkspaceViewController.js` is down to `19` lines and now composes `features/admin/hooks/useAdminWorkspaceViewInputController.js` and `features/admin/hooks/useAdminWorkspaceViewStateController.js`.
- `features/admin/hooks/useAdminEditorController.js` is down to `24` lines and now composes `features/admin/hooks/useAdminContentEditorController.js` and `features/admin/hooks/useAdminManagedContentCommerceController.js`.
- `features/admin/hooks/useAdminManagedContentCommerceController.js` is down to `23` lines and now composes `features/admin/hooks/useAdminCommerceEditorController.js` and `features/admin/hooks/useAdminManagedContentController.js`.
- `features/admin/hooks/useAdminContentEditorController.js` is down to `24` lines and now composes `features/admin/hooks/useAdminContentSliceController.js` and `features/admin/hooks/useAdminContentSectionController.js`.
- `features/admin/hooks/useAdminActionController.js` is down to `41` lines and now composes `features/admin/hooks/useAdminPipelineActionController.js`, `features/admin/hooks/useAdminQrActionController.js`, `features/admin/hooks/useAdminDangerActionController.js`, and `features/admin/hooks/useAdminActionResetController.js`.
- `features/admin/hooks/useAdminPipelineActions.js` is down to `44` lines and now adapts the admin shell to the standalone `features/production-pipeline/hooks/useProductionPipelineOrchestrator.js`.
- `features/production-pipeline/hooks/useProductionPipelineOrchestrator.js` is `129` lines and now acts as the central in-process orchestrator over independent command-policy, persistence, and record-sync services.
- `features/public-experience/hooks/usePublicExperienceShellController.js` is down to `29` lines and now composes `features/public-experience/hooks/usePublicExperienceSceneController.js` and `features/public-experience/hooks/usePublicExperienceAudioController.js`.
- active admin route code no longer contains live `supabase.from(...)` or `supabase.storage...` calls
- `lint` passes with `0` warnings.
- `test` passes: `254` tests.
- `build` passes.
- `smoke:refactor` passes.

Recommended next slice:

- Code refactor slices in scope are complete for the admin and public routes.
- The remaining browser-only follow-up is still the manual click-through pass on the admin and public flows.

## Target Structure

Keep Next.js routes in `app/`, but move feature logic into dedicated modules:

```text
app/
  page.js
  settings/page.js
  doll/[slug]/page.js
  api/ai/generate/route.js

features/
  admin/
    components/
    hooks/
    services/
    mappers/
    state/
    constants/
    styles/
  public-experience/
    components/
    hooks/
    mappers/
    constants/
    styles/
  settings/
    components/
    hooks/
    services/

lib/
  supabase/
  ai/
  shared/
  validation/
```

If we want to minimize churn even more, the first step can use `app/_components`, `app/_hooks`, and `app/_lib`, then move to `features/` later. The important part is separation of responsibilities, not the exact folder name.

## Phased Plan

### Phase 0: Lock In a Safety Baseline

Purpose:
Create enough protection to refactor without guessing.

Work:

- Add ESLint configuration so `npm run lint` becomes a real gate.
- Add a lightweight test runner and start with pure-function coverage.
- Capture a manual smoke checklist for the current working flows:
  - load admin page
  - create doll
  - edit identity
  - save story
  - generate managed content
  - generate/upload QR
  - open public doll page
  - save settings
- Record current build result and bundle sizes as a baseline.

Deliverables:

- working lint command
- initial test command
- short regression checklist in `docs/`

Exit criteria:

- `build` passes
- `lint` runs non-interactively
- baseline smoke checklist is documented

### Phase 1: Extract Pure Domain Logic From `app/page.js`

Purpose:
Shrink the admin route without changing behavior.

Work:

- Move constants and enums out of `app/page.js`:
  - statuses
  - department config
  - board filters/sorts
  - default content state
- Move pure helper functions out of `app/page.js` into feature/domain modules:
  - normalization helpers
  - content state builders
  - snapshot/signature helpers
  - readiness derivation
  - operations-card derivation and sorting
  - slug/public URL helpers
- Keep the page component importing the extracted functions so behavior stays identical.

Suggested modules:

- `features/admin/constants/workflow.js`
- `features/admin/constants/content.js`
- `features/admin/mappers/contentState.js`
- `features/admin/mappers/readiness.js`
- `features/admin/mappers/operations.js`
- `features/admin/utils/strings.js`

Exit criteria:

- `app/page.js` loses pure business logic but still renders the same UI
- extracted modules have unit tests

### Phase 2: Introduce an Explicit Data-Access Layer

Purpose:
Stop the UI from talking directly to Supabase and storage everywhere.

Work:

- Extract all admin data operations into services:
  - themes
  - dolls
  - stories
  - orders
  - content assets
  - QR/storage uploads
- Extract AI generation requests behind a service boundary.
- Standardize return shapes and error handling.
- Centralize record normalization close to the data layer.

Suggested modules:

- `features/admin/services/themes.js`
- `features/admin/services/dolls.js`
- `features/admin/services/stories.js`
- `features/admin/services/orders.js`
- `features/admin/services/contentAssets.js`
- `features/admin/services/qr.js`
- `features/admin/services/ai.js`

Exit criteria:

- route component no longer contains direct `supabase.from(...)` and storage logic
- network/storage errors are normalized in one place

### Phase 3: Split Admin State Into Focused Hooks

Purpose:
Replace the single giant stateful page with composable behavior units.

Work:

- Extract admin auth behavior:
  - `useAdminAccess`
- Extract collection loading and selection:
  - `useDolls`
  - `useSelectedDoll`
- Extract content editing flows:
  - `useStoryEditor`
  - `useContentPackEditor`
  - `useSocialEditor`
  - `useManagedContent`
- Extract pipeline workflow:
  - `usePipelineWorkflow`
- Extract QR and digital identity actions:
  - `useQrWorkflow`
- Extract transient UI behaviors:
  - notices/errors
  - workspace mode
  - danger-zone confirmation

Important rule:

- Hooks should depend on service modules and pure mappers, not on route-local helpers.

Exit criteria:

- `app/page.js` mostly becomes orchestration plus layout
- state changes can be tested in hook-level tests

### Phase 4: Break the Admin UI Into Feature Components

Purpose:
Make the UI understandable and editable by section.

Work:

- Split the admin screen into stable top-level areas:
  - `AdminShell`
  - `AdminHeader`
  - `DollSidebar`
  - `WorkspaceSwitcher`
  - `DashboardWorkspace`
  - `PipelineWorkspace`
  - `ContentStudioWorkspace`
- Inside each workspace, split by domain section:
  - identity
  - production
  - character
  - content
  - digital
  - commerce
  - danger zone
- Move the warning modal and status cards into standalone reusable components.

Preferred sequencing:

- extract leaf components first
- extract workspace containers second
- keep props explicit rather than passing the whole page state object everywhere

Exit criteria:

- admin route is primarily composition
- each UI section lives in its own file
- prop contracts are clearer than today

### Phase 5: Tame the Style System

Purpose:
Reduce the 1-file inline style sprawl without triggering a visual rewrite.

Work:

- Create shared design tokens for spacing, radius, typography, and semantic colors.
- Move repeated button/card/badge styles into shared style helpers or CSS modules.
- Keep visual output intentionally unchanged in the first pass.
- Only after the structure is stable, decide whether to keep JS style objects or migrate sections to CSS modules.

Recommended low-risk approach:

- First extract style objects into feature-level style files.
- Later migrate the most stable components to CSS modules if that improves readability.

Exit criteria:

- route files stop carrying the whole design system
- repeated visual primitives are centralized

### Phase 6: Refactor the Public Experience Slice

Purpose:
Bring the public route up to the same standard as the admin side.

Work:

- Remove `testStoryRows` from `app/doll/[slug]/page.js` and use fetched story data.
- Move experience loading into a dedicated service/hook pair.
- Extract scene navigation and audio control from `V1ExperienceShell`.
- Separate:
  - theme resolution
  - ambient particle config
  - audio orchestration
  - scene progression
- Move `rosie` demo overrides out of `lib/publicExperience.js` into fixtures or seed content so production logic remains generic.

Suggested modules:

- `features/public-experience/services/loadExperience.js`
- `features/public-experience/hooks/useExperienceAudio.js`
- `features/public-experience/hooks/useSceneNavigation.js`
- `features/public-experience/mappers/buildExperience.js`
- `features/public-experience/fixtures/rosie.js`

Exit criteria:

- public route uses real source data
- shell component focuses on rendering/composition, not all orchestration

### Phase 7: Replace Temporary Client-Side Admin Protection

Purpose:
Remove an architectural risk while the internals are already cleaner.

Work:

- Replace browser-only password gating with a server-backed approach.
- Options:
  - Next middleware with signed cookie
  - Supabase auth / protected admin role
  - route-handler based session gate
- Keep the UX simple, but move the trust boundary off the client.

Exit criteria:

- no client-only password comparison
- no reliance on `localStorage` as the security boundary

## Recommended Pull Request Sequence

To keep risk low, split the work into small PRs:

1. Tooling baseline: ESLint, tests, smoke checklist
2. Extract pure admin constants and mappers
3. Extract admin services
4. Extract admin hooks
5. Extract admin UI components
6. Extract shared styles/tokens
7. Public experience cleanup
8. Admin auth hardening

## Verification Strategy

Run after every phase:

- `npm run build`
- `npm run lint`
- targeted unit tests
- manual smoke pass on admin and public routes

Add tests in this order:

1. Pure-function tests for `pipelineState`, readiness, normalization, and experience builders
2. Hook tests for admin workflows
3. Component tests for critical admin panels
4. End-to-end smoke tests for create/edit/save/view flows

## What Not To Do

- Do not rewrite the UI and architecture in the same PR.
- Do not change Supabase schema and component structure at the same time.
- Do not move every inline style to CSS before the feature boundaries are clear.
- Do not keep temporary fixture logic in the live rendering path.
- Do not pass giant mutable objects through every extracted component if a narrower prop contract will do.

## First Execution Slice

The safest first implementation slice is:

1. Set up ESLint and a test runner.
2. Extract pure helpers from `app/page.js`.
3. Add unit tests for those helpers.
4. Leave JSX, Supabase calls, and visual output untouched.

That slice gives immediate maintainability gains with the lowest regression risk.
