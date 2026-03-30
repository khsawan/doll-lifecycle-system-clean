import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import { saveAdminStory } from "features/admin/services/stories";
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

function readStoryPayload(body) {
  return body?.story && typeof body.story === "object" && !Array.isArray(body.story)
    ? body.story
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
  const story = readStoryPayload(body);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  if (!story) {
    return jsonResponse({ ok: false, error: "Invalid story payload." }, 400);
  }

  try {
    const client = createAdminStoreClient();
    const result = await saveAdminStory(client, dollId, story);

    return jsonResponse({
      ok: true,
      ...result,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save story.",
      },
      500
    );
  }
}
