import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const bundleDir = path.join(projectRoot, "claude-context");

// ---------------------------------------------------------------------------
// Context files to include as project knowledge uploads
// ---------------------------------------------------------------------------
const contextFiles = [
  // -- Docs (highest signal for architecture and rules) --
  "docs/ARCHITECTURE_HANDOFF.md",
  "docs/DOLL_LIFECYCLE_SYSTEM.md",
  "docs/WORKFLOW_RULES.md",
  "docs/PROJECT_REFACTOR_PLAN.md",
  "docs/CONTENT_GUIDELINES.md",
  "docs/SOURCE_CONTEXT_FILES.md",
  "README.md",
  "apps/ai-service/README.md",

  // -- Config --
  "package.json",
  "jsconfig.json",
  "next.config.mjs",
  ".env.example",
  "vitest.config.mjs",
  "eslint.config.mjs",

  // -- Critical lib: pipeline, supabase, shared contracts --
  "lib/pipelineState.js",
  "lib/supabase.js",
  "lib/publicExperience.js",
  "lib/shared/contracts/index.js",
  "lib/shared/contracts/commands.js",
  "lib/shared/contracts/results.js",
  "lib/shared/contracts/errors.js",

  // -- AI capability boundary --
  "lib/ai/index.js",
  "lib/ai/normalize.js",
  "lib/ai/domain/requests.js",
  "lib/ai/domain/results.js",
  "lib/ai/domain/taskRouting.js",
  "lib/ai/application/generateStory.js",
  "lib/ai/application/generateContentPack.js",
  "lib/ai/application/generateSocial.js",
  "lib/ai/application/shared.js",
  "lib/ai/infrastructure/prompts.js",
  "lib/ai/infrastructure/settings.js",
  "lib/ai/infrastructure/providers.js",
  "lib/ai/interface/factory.js",
  "lib/ai/interface/service.js",
  "lib/ai/interface/transport.js",
  "lib/ai/interface/requests.js",
  "lib/ai/interface/responses.js",
  "lib/ai/prompts/story.js",
  "lib/ai/prompts/contentPack.js",
  "lib/ai/prompts/social.js",
  "lib/ai/providers/anthropic.js",

  // -- Orchestrator application entry points --
  "features/orchestrator/application/generateStory.js",
  "features/orchestrator/application/generateContentPack.js",
  "features/orchestrator/application/generateSocial.js",
  "features/orchestrator/application/generateQr.js",
  "features/orchestrator/application/advancePipelineStage.js",
  "features/orchestrator/shared/context.js",
  "features/orchestrator/shared/helpers.js",

  // -- Admin: domain --
  "features/admin/domain/workflow.js",
  "features/admin/domain/shellState.js",
  "features/admin/domain/workspaceView.js",
  "features/admin/domain/operations.js",
  "features/admin/domain/session.js",
  "features/admin/domain/generation.js",
  "features/admin/domain/content.js",
  "features/admin/domain/detailState.js",
  "features/admin/domain/access.js",
  "features/admin/domain/runtime.js",

  // -- Admin: key hooks (controllers) --
  "features/admin/hooks/useAdminAccess.js",
  "features/admin/hooks/useAdminPageAccessController.js",
  "features/admin/hooks/useAdminPageShellController.js",
  "features/admin/hooks/useAdminAuthenticatedShellController.js",
  "features/admin/hooks/useAdminShellCompositionController.js",
  "features/admin/hooks/useAdminSelectedWorkspaceController.js",
  "features/admin/hooks/useAdminEditorActionShellController.js",
  "features/admin/hooks/useAdminPipelineActions.js",

  // -- Admin: shell components --
  "features/admin/components/AdminRouteView.js",
  "features/admin/components/AdminAuthenticatedShellLoader.js",
  "features/admin/components/AdminAuthenticatedShell.js",
  "features/admin/components/AdminAppShell.js",

  // -- Admin: key services --
  "features/admin/services/store.js",
  "features/admin/services/ai.js",
  "features/admin/services/dolls.js",
  "features/admin/services/catalogApi.js",
  "features/admin/services/pipelineApi.js",
  "features/admin/services/detailApi.js",

  // -- Public experience --
  "features/public-experience/hooks/usePublicExperiencePageController.js",
  "features/public-experience/hooks/usePublicExperienceShellController.js",
  "features/public-experience/hooks/usePublicExperienceSceneController.js",
  "features/public-experience/hooks/usePublicExperienceAudioController.js",
  "features/public-experience/mappers/buildExperience.js",
  "features/public-experience/services/experience.js",
  "features/public-experience/domain/navigation.js",
  "features/public-experience/domain/audio.js",
  "features/public-experience/domain/runtime.js",
  "features/public-experience/components/PublicExperienceRouteView.js",

  // -- Production pipeline --
  "features/production-pipeline/hooks/useProductionPipelineOrchestrator.js",
  "features/production-pipeline/domain/commands.js",
  "features/production-pipeline/services/commandExecutor.js",
  "features/production-pipeline/services/recordSync.js",
  "features/production-pipeline/services/store.js",

  // -- Settings --
  "features/settings/domain/settings.js",
  "features/settings/services/settingsStore.js",
  "features/settings/services/settingsApi.js",
  "features/settings/hooks/useAdminSettings.js",
  "features/settings/components/SettingsPageContent.js",

  // -- App routes (thin entry points) --
  "app/page.js",
  "app/settings/page.js",
  "app/doll/[slug]/page.js",
  "app/doll/[slug]/V1ExperienceShell.js",
  "app/api/ai/generate/route.js",
  "app/api/admin/session/route.js",
  "app/api/admin/catalog/route.js",
  "app/api/admin/dolls/[id]/route.js",
  "app/api/admin/dolls/[id]/detail/route.js",
  "app/api/admin/dolls/[id]/pipeline-state/route.js",

  // -- Apps --
  "apps/ai-service/server.mjs",
];

// ---------------------------------------------------------------------------
// Project Instructions — paste this into Claude Project → Instructions
// ---------------------------------------------------------------------------
const CLAUDE_PROJECT_INSTRUCTIONS = `# Maille wt Merveille — Doll Lifecycle System

## What This System Is
A production operating system for handmade dolls. It manages the full lifecycle from registration through content creation to public digital activation. Built for a single admin operator who creates, configures, and activates dolls. Each doll gets a digital identity: a story, a public experience page, a QR code, and commerce-ready status.

## Tech Stack
- **Next.js 15** App Router, **React 19**
- **Supabase** (PostgreSQL + RLS + Storage bucket: \`doll-assets\`)
- **AI**: Anthropic (Claude) + Google Gemini, switchable via \`AI_PROVIDER\` env var, with local/remote service modes
- **Vitest** for tests (254 passing)

## Architecture — 3 Layers

\`\`\`
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
\`\`\`

Within each feature: \`components/\` → \`hooks/\` (controllers) → \`services/\` (external calls) → \`domain/\` (pure business logic).

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
- \`pipeline_state\` (JSONB column) is the **source of truth** for pipeline progression
- Readiness is **separate** from progression — a stage can be open without being ready
- \`commerce_status\` is separate from order status
- Database tables: \`dolls\`, \`stories\`, \`content_assets\`, \`orders\`, \`themes\`, \`app_settings\`

## Coding Conventions
- **Checklist-first** — plan before implementing, one step at a time
- Changes must be **localized to the smallest responsible area**
- **No breaking changes** to existing functionality
- Prefer **additive and reversible** changes over risky rewrites
- After any pipeline/readiness/architecture change: **update \`docs/DOLL_LIFECYCLE_SYSTEM.md\`**
- Validate each step before moving to the next

## File Reference Guide

| What you need | Where to look |
|---------------|---------------|
| Pipeline logic and locking rules | \`lib/pipelineState.js\` |
| Admin orchestration | \`features/admin/hooks/\` |
| Admin business logic | \`features/admin/domain/\` |
| Public doll experience | \`features/public-experience/\` |
| AI generation workflows | \`lib/ai/\` + \`features/orchestrator/application/\` |
| Pipeline stage advancement | \`features/production-pipeline/\` |
| API route boundaries | \`app/api/admin/*/route.js\` |
| App settings / AI config | \`features/settings/\` |
| Service contracts | \`lib/shared/contracts/\` |
| Architecture overview | \`docs/ARCHITECTURE_HANDOFF.md\` |
| System spec and pipeline model | \`docs/DOLL_LIFECYCLE_SYSTEM.md\` |
| Workflow and change rules | \`docs/WORKFLOW_RULES.md\` |

## Current Branch
Active branch: \`feature/refactor-project-structure\`
A major structural refactor moved business logic from monolithic \`page.js\` files into feature modules under \`features/\`. The refactor is complete and all quality gates pass (lint, test, build, smoke). See \`docs/ARCHITECTURE_HANDOFF.md\` for the current state.
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function assertInsideProject(targetPath) {
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(projectRoot + path.sep)) {
    throw new Error(`Refusing to operate outside project root: ${resolvedTarget}`);
  }
  return resolvedTarget;
}

async function ensureSourceFilesExist(relativePaths) {
  const missing = [];
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    try {
      await fs.access(absolutePath);
    } catch {
      missing.push(relativePath);
    }
  }
  if (missing.length > 0) {
    console.warn(`\nWarning: ${missing.length} file(s) not found (skipped):\n${missing.map((f) => `  - ${f}`).join("\n")}\n`);
  }
  return missing;
}

async function copyContextFiles(relativePaths, missingSet) {
  let copied = 0;
  for (const relativePath of relativePaths) {
    if (missingSet.has(relativePath)) continue;
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(bundleDir, relativePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
    copied++;
  }
  return copied;
}

async function writeGeneratedFiles(relativePaths, missingSet) {
  const included = relativePaths.filter((f) => !missingSet.has(f));
  const orderedList = included.map((f) => `- \`${f}\``).join("\n");

  const readmeContent = `# Claude Context Bundle — Maille wt Merveille

This folder contains the curated project files for giving Claude full context of the Doll Lifecycle System.

## How to use this bundle

### Step 1 — Set Project Instructions
Open your Claude Project → **Instructions**.
Copy and paste the full contents of \`CLAUDE_PROJECT_INSTRUCTIONS.md\` into the instructions field.

### Step 2 — Upload Project Knowledge files
Upload all other files in this folder to Claude Project → **Add content**.
Preserve subdirectory structure where possible, or upload flat — Claude will still index the content.

### Recommended upload order (highest signal first)
1. \`docs/ARCHITECTURE_HANDOFF.md\`
2. \`docs/DOLL_LIFECYCLE_SYSTEM.md\`
3. \`docs/WORKFLOW_RULES.md\`
4. \`docs/PROJECT_REFACTOR_PLAN.md\`
5. \`docs/CONTENT_GUIDELINES.md\`
6. \`package.json\` + config files
7. Route entry files under \`app/\`
8. Feature controllers/hooks/services under \`features/\`
9. Shared lib modules under \`lib/\`
10. Protected API routes under \`app/api/\`

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
- \`.env.local\` and any secret-bearing files
- \`node_modules/\`, \`.next/\`, temp logs, and generated artifacts
- All 28 admin UI leaf components (context overhead without architecture signal)
- Full test suite (useful for verification, not for architecture handoff)
- Lock file (\`package-lock.json\`)

The full file list is in \`FILE_LIST.md\`.
`;

  const manifestContent = `# Included Files (${included.length} total)\n\n${orderedList}\n`;
  const instructionsPath = path.join(bundleDir, "CLAUDE_PROJECT_INSTRUCTIONS.md");
  const readmePath = path.join(bundleDir, "BUNDLE_README.md");
  const manifestPath = path.join(bundleDir, "FILE_LIST.md");

  await fs.writeFile(instructionsPath, CLAUDE_PROJECT_INSTRUCTIONS, "utf8");
  await fs.writeFile(readmePath, readmeContent, "utf8");
  await fs.writeFile(manifestPath, manifestContent, "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  assertInsideProject(bundleDir);

  console.log("Checking source files…");
  const missing = await ensureSourceFilesExist(contextFiles);
  const missingSet = new Set(missing);

  console.log("Rebuilding claude-context/…");
  await fs.rm(bundleDir, { recursive: true, force: true });
  await fs.mkdir(bundleDir, { recursive: true });

  const copied = await copyContextFiles(contextFiles, missingSet);
  await writeGeneratedFiles(contextFiles, missingSet);

  const total = copied + 3; // +3 for the 3 generated files
  console.log(`\nDone. Created claude-context/ with ${total} files (${copied} source + 3 generated).`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open claude-context/CLAUDE_PROJECT_INSTRUCTIONS.md — paste into Claude Project → Instructions`);
  console.log(`  2. Upload all other files in claude-context/ to Claude Project → Add content`);
  console.log(`  See claude-context/BUNDLE_README.md for full usage guide.\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
