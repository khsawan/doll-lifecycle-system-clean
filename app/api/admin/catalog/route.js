import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_THEMES } from "../../../../features/admin/constants/content";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "../../../../features/admin/domain/session";
import { createAdminDoll, fetchAdminDolls } from "../../../../features/admin/services/dolls";
import { createAdminStoreClient } from "../../../../features/admin/services/store";
import { fetchThemeOptions } from "../../../../features/admin/services/themes";

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

function readCreateDollPayload(body) {
  const basePayload =
    body?.basePayload &&
    typeof body.basePayload === "object" &&
    !Array.isArray(body.basePayload)
      ? body.basePayload
      : null;

  if (!basePayload) {
    return null;
  }

  return {
    basePayload,
    defaultPipelineState:
      body?.defaultPipelineState &&
      typeof body.defaultPipelineState === "object" &&
      !Array.isArray(body.defaultPipelineState)
        ? body.defaultPipelineState
        : null,
    pipelineTimestamp:
      typeof body?.pipelineTimestamp === "string" && body.pipelineTimestamp.trim()
        ? body.pipelineTimestamp.trim()
        : null,
  };
}

export async function GET() {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  try {
    const client = createAdminStoreClient();
    const [themes, dolls] = await Promise.all([
      fetchThemeOptions(client, DEFAULT_THEMES),
      fetchAdminDolls(client),
    ]);

    return jsonResponse({
      ok: true,
      themes,
      dolls,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load catalog.",
      },
      500
    );
  }
}

export async function POST(request) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const body = await request.json().catch(() => null);
  const payload = readCreateDollPayload(body);

  if (!payload) {
    return jsonResponse(
      {
        ok: false,
        error: "Invalid doll payload.",
      },
      400
    );
  }

  try {
    const client = createAdminStoreClient();
    const doll = await createAdminDoll(client, payload);

    return jsonResponse(
      {
        ok: true,
        doll,
      },
      201
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create doll.",
      },
      500
    );
  }
}
