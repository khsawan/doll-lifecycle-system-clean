import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import { createGenerateQrCommand, readFailureResultMessage, readSuccessResultData } from "lib/shared/contracts";
import { generateQr } from "features/orchestrator/application/generateQr";

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

function readQrPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const storageKey =
    typeof body.storageKey === "string" && body.storageKey.trim()
      ? body.storageKey.trim()
      : "";
  const qrSource =
    typeof body.qrSource === "string" && body.qrSource.trim() ? body.qrSource : "";

  if (!storageKey || !qrSource) {
    return null;
  }

  return {
    storageKey,
    qrSource,
    forceRefresh: typeof body.forceRefresh === "boolean" ? body.forceRefresh : false,
  };
}

export async function PUT(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const dollId = normalizeDollId(resolvedParams?.id);
  const body = await request.json().catch(() => null);
  const payload = readQrPayload(body);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  if (!payload) {
    return jsonResponse({ ok: false, error: "Invalid QR upload payload." }, 400);
  }

  try {
    const result = await generateQr({
      command: createGenerateQrCommand({
        dollId,
        payload: {
          storageKey: payload.storageKey,
          qrSource: payload.qrSource,
          forceRefresh: payload.forceRefresh,
        },
      }),
    });

    if (!result.ok) {
      const status = result.retryable ? 500 : 400;

      return jsonResponse(
        {
          ok: false,
          error: readFailureResultMessage(result, "Failed to upload QR code."),
        },
        status
      );
    }

    const data = readSuccessResultData(result, {});

    return jsonResponse({
      ok: true,
      ...data,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to upload QR code.",
      },
      500
    );
  }
}
