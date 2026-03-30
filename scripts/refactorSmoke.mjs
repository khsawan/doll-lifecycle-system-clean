import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const INVALID_SMOKE_SLUG = "__refactor_smoke_invalid__";
const SERVER_START_TIMEOUT_MS = 30_000;
const SERVER_POLL_INTERVAL_MS = 500;

function logStep(message) {
  console.log(`[smoke] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEnvFile(content) {
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

async function loadLocalEnv(rootDir) {
  const envPath = path.join(rootDir, ".env.local");

  try {
    const envFile = await readFile(envPath, "utf8");
    const entries = parseEnvFile(envFile);

    for (const [key, value] of Object.entries(entries)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }

    return entries;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a local smoke-test port."));
        return;
      }

      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, serverProcess, logs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SERVER_START_TIMEOUT_MS) {
    if (serverProcess.exitCode !== null) {
      throw new Error(
        `Smoke server exited early with code ${serverProcess.exitCode}.\n${logs.stderr.trim()}`
      );
    }

    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status > 0) {
        return;
      }
    } catch {
    }

    await sleep(SERVER_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Timed out waiting for the smoke server to start.\n${logs.stderr.trim()}`
  );
}

function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(serverProcess.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  serverProcess.kill("SIGTERM");
}

function startSmokeServer(rootDir, port) {
  if (process.platform === "win32") {
    const command = `npm.cmd run start -- -p ${port}`;
    return spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command], {
      cwd: rootDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  return spawn("npm", ["run", "start", "--", "-p", String(port)], {
    cwd: rootDir,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function fetchPage(baseUrl, route, expectedMarker) {
  const response = await fetch(`${baseUrl}${route}`);
  const html = await response.text();

  assert(response.ok, `GET ${route} returned ${response.status}.`);
  assert(
    html.includes(expectedMarker),
    `GET ${route} did not include the expected marker: ${expectedMarker}`
  );

  logStep(`Verified ${route} (${response.status})`);
}

async function fetchJson(baseUrl, route, predicate, predicateMessage) {
  const response = await fetch(`${baseUrl}${route}`);
  const body = await response.json();

  assert(response.ok, `GET ${route} returned ${response.status}.`);
  assert(predicate(body), predicateMessage);

  logStep(`Verified ${route} (${response.status})`);
  return body;
}

async function fetchProtectedAdminApi(
  baseUrl,
  route,
  protectionEnabled,
  successPredicate,
  successMessage
) {
  const response = await fetch(`${baseUrl}${route}`);
  const body = await response.json().catch(() => ({}));

  if (protectionEnabled) {
    assert(
      response.status === 401,
      `GET ${route} returned ${response.status} instead of 401 for a protected admin surface.`
    );
    assert(
      typeof body?.error === "string" && body.error.trim(),
      `GET ${route} did not return the expected unauthorized payload.`
    );
    logStep(`Verified ${route} (${response.status})`);
    return;
  }

  assert(response.ok, `GET ${route} returned ${response.status}.`);
  assert(
    successPredicate(body),
    successMessage
  );
  logStep(`Verified ${route} (${response.status})`);
}

async function fetchProtectedAdminMutationApi(baseUrl, route, method, protectionEnabled) {
  if (!protectionEnabled) {
    logStep(`Skipped ${route} mutation check (admin protection disabled)`);
    return;
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: "{}",
  });
  const body = await response.json().catch(() => ({}));

  assert(
    response.status === 401,
    `${method} ${route} returned ${response.status} instead of 401 for a protected admin mutation surface.`
  );
  assert(
    typeof body?.error === "string" && body.error.trim(),
    `${method} ${route} did not return the expected unauthorized payload.`
  );

  logStep(`Verified ${route} (${response.status})`);
}

async function resolvePublicSmokeRecord(client) {
  const { data, error } = await client
    .from("dolls")
    .select("id, slug, name")
    .not("slug", "is", null)
    .limit(10);

  if (error) {
    throw new Error(`Could not load a public smoke-check doll: ${error.message}`);
  }

  const record = (data || []).find((row) => typeof row.slug === "string" && row.slug.trim());
  assert(record, "Could not find a doll with a usable slug for the public smoke check.");

  return record;
}

async function verifyPublicDataPath(client, dollRecord) {
  const { data: storyRows, error: storyError, count: storyCount } = await client
    .from("stories")
    .select("id", { count: "exact" })
    .eq("doll_id", dollRecord.id);

  if (storyError) {
    throw new Error(`Could not load public story rows for smoke check: ${storyError.message}`);
  }

  logStep(
    `Resolved public smoke doll "${dollRecord.name || dollRecord.slug}" (${dollRecord.slug}) with ${
      typeof storyCount === "number" ? storyCount : storyRows?.length || 0
    } story row(s)`
  );

  const { data: invalidRows, error: invalidError } = await client
    .from("dolls")
    .select("id")
    .eq("slug", INVALID_SMOKE_SLUG)
    .limit(1);

  if (invalidError) {
    throw new Error(`Could not verify invalid public slug behavior: ${invalidError.message}`);
  }

  assert(
    !invalidRows || invalidRows.length === 0,
    `The reserved invalid smoke slug "${INVALID_SMOKE_SLUG}" already exists in the database.`
  );

  logStep("Verified invalid public slug data path");
}

async function main() {
  const rootDir = process.cwd();
  await loadLocalEnv(rootDir);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  assert(supabaseUrl && supabaseKey, "Missing Supabase environment variables for smoke checks.");

  const client = createClient(supabaseUrl, supabaseKey);
  const smokeDoll = await resolvePublicSmokeRecord(client);
  await verifyPublicDataPath(client, smokeDoll);

  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const logs = { stdout: "", stderr: "" };
  const serverProcess = startSmokeServer(rootDir, port);

  serverProcess.stdout.on("data", (chunk) => {
    logs.stdout += chunk.toString();
  });
  serverProcess.stderr.on("data", (chunk) => {
    logs.stderr += chunk.toString();
  });

  try {
    logStep(`Starting Next.js smoke server on ${baseUrl}`);
    await waitForServer(baseUrl, serverProcess, logs);

    await fetchPage(baseUrl, "/", "Checking admin access...");
    await fetchPage(baseUrl, "/settings", "Checking admin access...");
    const sessionPayload = await fetchJson(
      baseUrl,
      "/api/admin/session",
      (body) =>
        typeof body?.authenticated === "boolean" &&
        typeof body?.protectionEnabled === "boolean",
      "GET /api/admin/session did not return the expected auth payload."
    );
    await fetchProtectedAdminApi(
      baseUrl,
      "/api/admin/settings",
      sessionPayload.protectionEnabled,
      (body) => Array.isArray(body?.settings),
      "GET /api/admin/settings did not return the expected settings payload."
    );
    await fetchProtectedAdminApi(
      baseUrl,
      "/api/admin/catalog",
      sessionPayload.protectionEnabled,
      (body) => Array.isArray(body?.themes) && Array.isArray(body?.dolls),
      "GET /api/admin/catalog did not return the expected catalog payload."
    );
    await fetchProtectedAdminApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/detail`,
      sessionPayload.protectionEnabled,
      (body) =>
        Array.isArray(body?.stories) &&
        Array.isArray(body?.contentRows) &&
        Array.isArray(body?.orders),
      "GET /api/admin/dolls/[id]/detail did not return the expected detail payload."
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}`,
      "PATCH",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}`,
      "DELETE",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/image`,
      "POST",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/qr`,
      "PUT",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/pipeline-state`,
      "PUT",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/story`,
      "PUT",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/content-pack`,
      "PUT",
      sessionPayload.protectionEnabled
    );
    await fetchProtectedAdminMutationApi(
      baseUrl,
      `/api/admin/dolls/${encodeURIComponent(smokeDoll.id)}/order`,
      "PUT",
      sessionPayload.protectionEnabled
    );
    await fetchPage(baseUrl, `/doll/${encodeURIComponent(smokeDoll.slug)}`, "Loading doll story...");
    await fetchPage(baseUrl, `/doll/${INVALID_SMOKE_SLUG}`, "Loading doll story...");

    logStep("Refactor smoke checks passed");
  } finally {
    stopServer(serverProcess);
  }
}

main().catch((error) => {
  console.error(`[smoke] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
