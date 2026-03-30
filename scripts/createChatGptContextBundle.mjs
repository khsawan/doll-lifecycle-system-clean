import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const bundleDir = path.join(projectRoot, "chatgpt-context");

const contextFiles = [
  "docs/ARCHITECTURE_HANDOFF.md",
  "docs/PROJECT_REFACTOR_PLAN.md",
  "docs/REFACTOR_SMOKE_CHECKLIST.md",
  "README.md",
  "package.json",
  "jsconfig.json",
  "next.config.mjs",
  "eslint.config.mjs",
  "vitest.config.mjs",
  ".env.example",
  "lib/supabase.js",
  "lib/pipelineState.js",
  "features/admin/domain/session.js",
  "app/page.js",
  "features/admin/components/AdminRouteView.js",
  "features/admin/components/AdminAuthenticatedShellLoader.js",
  "features/admin/hooks/useAdminAccess.js",
  "features/admin/hooks/useAdminPageAccessController.js",
  "features/admin/hooks/useAdminPageShellController.js",
  "features/admin/hooks/useAdminAuthenticatedShellController.js",
  "features/admin/components/AdminAuthenticatedShell.js",
  "features/admin/hooks/useAdminShellCompositionController.js",
  "features/admin/hooks/useAdminSelectedWorkspaceController.js",
  "features/admin/hooks/useAdminEditorActionShellController.js",
  "features/admin/domain/shellState.js",
  "features/admin/domain/workspaceView.js",
  "features/admin/domain/workflow.js",
  "features/admin/domain/operations.js",
  "features/admin/hooks/useAdminPipelineActions.js",
  "features/production-pipeline/hooks/useProductionPipelineOrchestrator.js",
  "features/production-pipeline/domain/commands.js",
  "features/production-pipeline/services/commandExecutor.js",
  "features/production-pipeline/services/recordSync.js",
  "features/production-pipeline/services/store.js",
  "app/doll/[slug]/page.js",
  "app/doll/[slug]/V1ExperienceShell.js",
  "features/public-experience/components/PublicExperienceRouteView.js",
  "features/public-experience/hooks/usePublicExperiencePageController.js",
  "features/public-experience/hooks/usePublicExperienceShellController.js",
  "features/public-experience/hooks/usePublicExperienceSceneController.js",
  "features/public-experience/hooks/usePublicExperienceAudioController.js",
  "features/public-experience/mappers/buildExperience.js",
  "features/public-experience/services/experience.js",
  "app/settings/page.js",
  "features/settings/services/settingsStore.js",
  "lib/ai/index.js",
  "app/api/ai/generate/route.js",
  "app/api/admin/session/route.js",
  "app/api/admin/catalog/route.js",
  "app/api/admin/dolls/[id]/route.js",
  "app/api/admin/dolls/[id]/detail/route.js",
  "app/api/admin/dolls/[id]/pipeline-state/route.js",
];

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
    throw new Error(`Missing source files:\n${missing.join("\n")}`);
  }
}

async function copyContextFiles(relativePaths) {
  for (const relativePath of relativePaths) {
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(bundleDir, relativePath);

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
  }
}

async function writeManifest(relativePaths) {
  const readmePath = path.join(bundleDir, "BUNDLE_README.md");
  const manifestPath = path.join(bundleDir, "FILE_LIST.md");
  const orderedList = relativePaths.map((filePath) => `- \`${filePath}\``).join("\n");

  const readmeContent = `# ChatGPT Context Bundle

This folder contains a curated copy of the highest-signal project files for bringing ChatGPT up to speed on the current architecture.

What is included:
- Architecture and refactor docs
- Runtime and config entry points
- Admin route, controllers, and core domain modules
- Production pipeline orchestrator and service boundaries
- Public experience route and controllers
- Settings and AI service paths
- Protected admin API boundaries

What is intentionally excluded:
- \`.env.local\` and any other secret-bearing files
- \`node_modules\`, \`.next\`, temp logs, and other generated artifacts
- Large test suites that are helpful for verification but not usually required for architecture handoff

Recommended paste order:
1. \`docs/ARCHITECTURE_HANDOFF.md\`
2. \`docs/PROJECT_REFACTOR_PLAN.md\`
3. \`package.json\`
4. Route entry files under \`app/\`
5. Feature controllers/hooks/services under \`features/\`
6. Supporting runtime files under \`lib/\`
7. Protected API routes under \`app/api/\`

The full copied file list lives in \`FILE_LIST.md\`.
`;

  const manifestContent = `# Included Files

${orderedList}
`;

  await fs.writeFile(readmePath, readmeContent, "utf8");
  await fs.writeFile(manifestPath, manifestContent, "utf8");
}

async function main() {
  assertInsideProject(bundleDir);
  await ensureSourceFilesExist(contextFiles);
  await fs.rm(bundleDir, { recursive: true, force: true });
  await fs.mkdir(bundleDir, { recursive: true });
  await copyContextFiles(contextFiles);
  await writeManifest(contextFiles);

  console.log(
    `Created chatgpt-context bundle with ${contextFiles.length} project files at ${bundleDir}`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
