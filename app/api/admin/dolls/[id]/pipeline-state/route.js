import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import { createAdminStoreClient } from "features/admin/services/store";
import { saveProductionPipelineState } from "features/production-pipeline/services/store";
import {
  createSuccessResult,
  normalizeErrorResult,
} from "lib/shared/contracts";

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, { status });
}

function unauthorizedResponse(shouldClearCookie) {
  const failure = normalizeErrorResult(
    {
      code: "ADMIN_AUTH_REQUIRED",
      message: "Admin authentication required.",
    },
    {
      message: "Admin authentication required.",
    }
  );
  const response = jsonResponse(
    {
      ok: false,
      error: failure.message,
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

function readPipelineStatePayload(body) {
  return body?.pipelineState &&
    typeof body.pipelineState === "object" &&
    !Array.isArray(body.pipelineState)
    ? body.pipelineState
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
  const pipelineState = readPipelineStatePayload(body);

  if (!dollId) {
    const failure = normalizeErrorResult(
      {
        code: "INVALID_DOLL_ID",
        message: "A doll id is required.",
      },
      {
        message: "A doll id is required.",
      }
    );

    return jsonResponse({ ok: false, error: failure.message }, 400);
  }

  if (!pipelineState) {
    const failure = normalizeErrorResult(
      {
        code: "INVALID_PIPELINE_STATE_PAYLOAD",
        message: "Invalid pipeline state payload.",
      },
      {
        message: "Invalid pipeline state payload.",
      }
    );

    return jsonResponse({ ok: false, error: failure.message }, 400);
  }

  try {
    const client = createAdminStoreClient();
    const result = await saveProductionPipelineState(client, dollId, pipelineState);
    const success = createSuccessResult({
      code: "PIPELINE_STATE_SAVED",
      message: "Pipeline state saved.",
      data: result,
    });

    return jsonResponse({
      ok: true,
      ...(success.data || {}),
    });
  } catch (error) {
    const failure = normalizeErrorResult(error, {
      code: "PIPELINE_STATE_SAVE_FAILED",
      message: "Failed to save pipeline state.",
      retryable: true,
    });

    return jsonResponse(
      {
        ok: false,
        error: failure.message,
      },
      500
    );
  }
}
