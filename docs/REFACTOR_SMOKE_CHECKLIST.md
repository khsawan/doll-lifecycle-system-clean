# Refactor Smoke Checklist

Baseline captured on March 28, 2026 for branch `feature/refactor-project-structure`.

## Automated Checks

Run these after each refactor slice:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke:refactor`

`npm run smoke:refactor` is a repeatable headless smoke pass. It:

- resolves a valid public doll slug from Supabase
- verifies the invalid public smoke slug remains absent
- starts the built Next.js app locally
- checks `/` and `/settings` for the pre-hydration admin access shell, `/api/admin/session` for the auth payload, the protected patch/delete surface at `/api/admin/dolls/[id]`, `/api/admin/settings`, `/api/admin/catalog`, `/api/admin/dolls/[id]/image`, `/api/admin/dolls/[id]/qr`, `/api/admin/dolls/[id]/pipeline-state`, `/api/admin/dolls/[id]/detail`, and the protected story/content-pack/order mutation endpoints for the expected protected-admin responses, and `/doll/[valid-slug]` plus `/doll/[invalid-slug]` for the expected public markers

## Manual Admin Checks

1. Open `/` and confirm the admin page loads without a blank screen.
2. If admin protection is enabled, confirm login works and logout returns to the access screen.
3. Create a new doll and confirm it appears in the left-side collection list.
4. Select a doll and edit Identity fields, then save and confirm the values persist after reload.
5. Edit Story content, save it, and confirm the saved story reloads correctly.
6. Generate managed content and confirm the generated intro, story pages, and play activity appear in the editor.
7. Generate or refresh the QR workflow and confirm the preview/download path still works.
8. Open the public link for a doll and confirm the page loads without an error state.
9. Open `/settings`, edit a setting, save it, and confirm the success notice appears.

## Manual Public Experience Checks

1. Open `/doll/[slug]` for a valid doll and confirm the welcome scene renders.
2. Advance through scenes and confirm story/play/friends navigation still works.
3. If audio URLs exist for the doll, confirm the shell audio controls still respond.
4. Open an invalid slug and confirm the error state renders instead of crashing.

## Notes

- The old temporary `testStoryRows` route path has been removed from `app/doll/[slug]/page.js`.
- Admin root login now uses a server-backed session endpoint, but broader admin-only route enforcement is still follow-up work.
- The browser-only interactions in the manual checklist still need a real click-through pass even after `npm run smoke:refactor` succeeds.
