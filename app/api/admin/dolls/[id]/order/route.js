import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import { saveAdminOrder } from "features/admin/services/orders";
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

function readOrderPayload(body) {
  const order =
    body?.order && typeof body.order === "object" && !Array.isArray(body.order)
      ? body.order
      : null;
  const options =
    body?.options && typeof body.options === "object" && !Array.isArray(body.options)
      ? body.options
      : {};

  if (!order) {
    return null;
  }

  return {
    order,
    options: {
      persistSalesStatus:
        typeof options.persistSalesStatus === "boolean"
          ? options.persistSalesStatus
          : true,
      nextSalesStatus:
        typeof options.nextSalesStatus === "string" && options.nextSalesStatus.trim()
          ? options.nextSalesStatus.trim()
          : "reserved",
    },
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
  const payload = readOrderPayload(body);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  if (!payload) {
    return jsonResponse({ ok: false, error: "Invalid order payload." }, 400);
  }

  try {
    const client = createAdminStoreClient();
    const result = await saveAdminOrder(
      client,
      dollId,
      payload.order,
      payload.options
    );

    return jsonResponse({
      ok: true,
      ...result,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save order.",
      },
      500
    );
  }
}
