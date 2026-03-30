# Refactor Merge Readiness

Status captured on March 29, 2026 for branch `feature/refactor-project-structure`.

## Summary

The structural refactor is functionally complete from a code-organization perspective:

- admin route logic has been split into feature components, hooks, services, domain helpers, and style modules
- public experience route logic has been split into feature components, hooks, services, fixtures, and domain helpers
- route files are dramatically smaller and now primarily compose extracted behavior
- repeatable automated verification is in place

## Verified Automated Gates

The following commands currently pass on this branch:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke:refactor`

Current verification snapshot:

- `app/page.js` reduced from `7,744` lines to `1,756`
- `app/doll/[slug]/V1ExperienceShell.js` reduced from `1,469` lines to `366`
- `94` tests passing
- `0` lint warnings

## Remaining Manual QA

These checks still require a real browser click-through:

- admin login and logout flow
- create doll flow
- identity/story/content save persistence after reload
- managed content generation UX
- QR preview, regenerate, print, and download flows
- settings edit/save success notice
- public scene navigation across welcome, story, play, and friends scenes
- public audio control responsiveness when audio URLs exist

Use [REFACTOR_SMOKE_CHECKLIST.md](REFACTOR_SMOKE_CHECKLIST.md) for the full manual pass.

## Known Follow-Up Risk

Admin auth hardening has started, but it is not fully complete yet:

- admin root login now uses a server-backed session endpoint
- password comparison is no longer happening in the browser
- `localStorage` is no longer the login/session boundary
- broader server-side enforcement for the remaining admin-only surfaces is still follow-up work

That is acceptable as documented carry-forward only if this branch is being merged with the remaining auth-enforcement work explicitly tracked.

## Merge Recommendation

This branch is ready for merge after:

1. the manual browser checklist is completed successfully
2. any issues from that pass are fixed
3. the final reviewer confirms the remaining auth-enforcement follow-up is understood as known debt
