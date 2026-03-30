import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateAIContent } from "../../../../lib/ai";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "../../../../features/admin/domain/session";
import {
  createGenerateContentPackCommand,
  createGenerateSocialCommand,
  createGenerateStoryCommand,
  normalizeErrorResult,
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../../lib/shared/contracts";
import { generateContentPack } from "../../../../features/orchestrator/application/generateContentPack";
import { generateSocial } from "../../../../features/orchestrator/application/generateSocial";
import { generateStory } from "../../../../features/orchestrator/application/generateStory";

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalEntityId(payload) {
  return (
    readOptionalString(payload?.dollId) ||
    readOptionalString(payload?.id) ||
    readOptionalString(payload?.slug)
  );
}

function buildAIGenerationCommand(task, payload, provider) {
  const metadata = provider ? { provider } : undefined;
  const entityId = readOptionalEntityId(payload);

  switch (task) {
    case "story":
      return createGenerateStoryCommand({ entityId, payload, metadata });
    case "content_pack":
      return createGenerateContentPackCommand({ entityId, payload, metadata });
    case "social":
      return createGenerateSocialCommand({ entityId, payload, metadata });
    default:
      return null;
  }
}

function buildLegacyAIGenerationBody(result) {
  const data = readSuccessResultData(result, null);

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      ok: true,
      ...data,
    };
  }

  if (result && typeof result === "object" && !Array.isArray(result)) {
    return {
      ok: true,
      task: result.task,
      provider: result.provider,
      result: result.result,
    };
  }

  return {
    ok: true,
  };
}

async function runAIGenerationAction(task, payload, provider) {
  const command = buildAIGenerationCommand(task, payload, provider);

  switch (task) {
    case "story":
      return generateStory({ command });
    case "content_pack":
      return generateContentPack({ command });
    case "social":
      return generateSocial({ command });
    default:
      return generateAIContent({
        provider,
        task,
        payload,
      });
  }
}

function badRequest(message) {
  const failure = normalizeErrorResult({ code: "BAD_REQUEST", message }, { message });
  return NextResponse.json({ ok: false, error: failure.message }, { status: 400 });
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
  const response = NextResponse.json({ ok: false, error: failure.message }, { status: 401 });

  if (shouldClearCookie) {
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      ...buildAdminSessionCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";
    const sessionState = readAdminSessionCookieState(token);

    if (!sessionState.authenticated) {
      return unauthorizedResponse(sessionState.shouldClearCookie);
    }

    const body = await request.json();
    const { provider, task, payload } = body || {};
    const normalizedProvider = readOptionalString(provider);
    const normalizedTask = readOptionalString(task);

    if (
      provider !== undefined &&
      provider !== null &&
      (typeof provider !== "string" || !normalizedProvider)
    ) {
      return badRequest("Invalid provider.");
    }

    if (!normalizedTask) {
      return badRequest("Missing task.");
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return badRequest("Missing or invalid payload.");
    }

    const result = await runAIGenerationAction(normalizedTask, payload, normalizedProvider);

    if (result?.ok === false) {
      const status = result.retryable ? 500 : 400;

      return NextResponse.json(
        {
          ok: false,
          error: readFailureResultMessage(result, "Failed to generate AI content."),
        },
        { status }
      );
    }

    return NextResponse.json(buildLegacyAIGenerationBody(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate AI content.";
    const status = /missing|invalid|unsupported/i.test(message) ? 400 : 500;
    const failure = normalizeErrorResult(error, {
      code: status === 400 ? "AI_GENERATION_INVALID_REQUEST" : "AI_GENERATION_FAILED",
      message,
      retryable: status >= 500,
    });

    return NextResponse.json({ ok: false, error: failure.message }, { status });
  }
}
