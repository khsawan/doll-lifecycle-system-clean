import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import { saveAdminContentPack } from "features/admin/services/contentAssets";
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

function readContentPackPayload(body) {
  return body?.contentPack &&
    typeof body.contentPack === "object" &&
    !Array.isArray(body.contentPack)
    ? body.contentPack
    : null;
}

export async function PUT(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const dollId = normalizeDollId(resolvedParams?.id);
  const body = await request.json().catch(() => null);
  const contentPack = readContentPackPayload(body);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  if (!contentPack) {
    return jsonResponse({ ok: false, error: "Invalid content pack payload." }, 400);
  }

  try {
    const client = createAdminStoreClient();
    const result = await saveAdminContentPack(client, dollId, contentPack);

    return jsonResponse({
      ok: true,
      ...result,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save content pack.",
      },
      500
    );
  }
}
