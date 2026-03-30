import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
import { readFailureResultMessage, readSuccessResultData } from "lib/shared/contracts";
import { createUploadImageRequest, uploadImage } from "lib/assets/interface";

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

function readImageFile(formData) {
  const file = formData?.get("file");

  return file &&
    typeof file === "object" &&
    typeof file.name === "string" &&
    file.name.trim()
    ? file
    : null;
}

export async function POST(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const dollId = normalizeDollId(resolvedParams?.id);
  const formData = await request.formData().catch(() => null);
  const file = readImageFile(formData);

  if (!dollId) {
    return jsonResponse({ ok: false, error: "A doll id is required." }, 400);
  }

  if (!file) {
    return jsonResponse({ ok: false, error: "An image file is required." }, 400);
  }

  try {
    const result = await uploadImage({
      request: createUploadImageRequest({
        dollId,
        payload: { file },
      }),
    });

    if (!result.ok) {
      const status = result.retryable ? 500 : 400;

      return jsonResponse(
        {
          ok: false,
          error: readFailureResultMessage(result, "Failed to upload image."),
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
        error: error instanceof Error ? error.message : "Failed to upload image.",
      },
      500
    );
  }
}
