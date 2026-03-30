import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import {
  deleteAdminDollPermanently,
  persistAdminDollPatch,
} from "features/admin/services/dolls";
import { createAdminStoreClient } from "features/admin/services/store";

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, { status });
}

function unauthorizedResponse(shouldClearCookie) {
  const response = jsonResponse(
    {
      ok: false,
      error: "Admin authentication required.",
    },
    401
  );

  if (shouldClearCookie) {
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      ...buildAdminSessionCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}

async function readAuthenticatedSessionState() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";
  return readAdminSessionCookieState(token);
}

function normalizeDollId(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function readPatchPayload(body) {
  if (!body?.patch || typeof body.patch !== "object" || Array.isArray(body.patch)) {
    return null;
  }

  return Object.keys(body.patch).length ? body.patch : null;
}

function readStoragePaths(body) {
  if (!Array.isArray(body?.storagePaths)) {
    return [];
  }

  return body.storagePaths
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function PATCH(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const dollId = normalizeDollId(resolvedParams?.id);
  const body = await request.json().catch(() => null);
  const patch = readPatchPayload(body);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  if (!patch) {
    return jsonResponse({ ok: false, error: "Invalid doll patch payload." }, 400);
  }

  try {
    const client = createAdminStoreClient();
    const dollPatch = await persistAdminDollPatch(client, dollId, patch);

    return jsonResponse({
      ok: true,
      dollPatch,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save doll changes.",
      },
      500
    );
  }
}

export async function DELETE(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const dollId = normalizeDollId(resolvedParams?.id);
  const body = await request.json().catch(() => null);
  const storagePaths = readStoragePaths(body);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  try {
    const client = createAdminStoreClient();
    const result = await deleteAdminDollPermanently(client, {
      dollId,
      storagePaths,
    });

    return jsonResponse({
      ok: true,
      ...result,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete doll.",
      },
      500
    );
  }
}
