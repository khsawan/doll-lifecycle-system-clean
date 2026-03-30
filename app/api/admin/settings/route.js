import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "../../../../features/admin/domain/session";
import { normalizeSettingsPayloadRows } from "../../../../features/settings/domain/settings";
import {
  createSettingsStoreClient,
  fetchSettingsRecords,
  persistSettingsRecords,
} from "../../../../features/settings/services/settingsStore";

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

export async function GET() {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  try {
    const client = createSettingsStoreClient();
    const settings = await fetchSettingsRecords(client);

    return jsonResponse({
      ok: true,
      settings,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to load settings.",
      },
      500
    );
  }
}

export async function PUT(request) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const body = await request.json().catch(() => null);
  const rows = normalizeSettingsPayloadRows(body?.settings);

  if (!rows) {
    return jsonResponse(
      {
        ok: false,
        error: "Invalid settings payload.",
      },
      400
    );
  }

  try {
    const client = createSettingsStoreClient();
    const settings = await persistSettingsRecords(client, rows);

    return jsonResponse({
      ok: true,
      settings,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save settings.",
      },
      500
    );
  }
}
