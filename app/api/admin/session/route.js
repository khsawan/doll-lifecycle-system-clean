import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  createAdminSessionToken,
  readAdminSessionCookieState,
  resolveAdminAuthConfig,
} from "../../../../features/admin/domain/session";

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, { status });
}

function clearAdminSessionCookie(response) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    ...buildAdminSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";
  const sessionState = readAdminSessionCookieState(token);
  const response = jsonResponse({
    authenticated: sessionState.authenticated,
    protectionEnabled: sessionState.protectionEnabled,
  });

  if (sessionState.shouldClearCookie) {
    clearAdminSessionCookie(response);
  }

  return response;
}

export async function POST(request) {
  const authConfig = resolveAdminAuthConfig();

  if (!authConfig.protectionEnabled) {
    return jsonResponse({
      ok: true,
      authenticated: true,
      protectionEnabled: false,
    });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!password) {
    return jsonResponse(
      {
        ok: false,
        error: "Missing password.",
      },
      400
    );
  }

  if (password !== authConfig.password) {
    return jsonResponse(
      {
        ok: false,
        error: "Incorrect password.",
      },
      401
    );
  }

  const response = jsonResponse({
    ok: true,
    authenticated: true,
    protectionEnabled: true,
  });

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken({ secret: authConfig.sessionSecret }),
    buildAdminSessionCookieOptions({
      secure: process.env.NODE_ENV === "production",
    })
  );

  return response;
}

export async function DELETE() {
  const response = jsonResponse({ ok: true });
  clearAdminSessionCookie(response);
  return response;
}
