import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminSessionCookieOptions,
  readAdminSessionCookieState,
} from "features/admin/domain/session";
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

const ALLOWED_PATCH_FIELDS = [
  "name",
  "slug",
  "description",
  "emotional_core",
  "tone_rules",
  "visual_theme",
  "audio_urls",
  "status",
];

function normalizeUniverseId(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function readUniversePatchPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const patch = {};

  for (const field of ALLOWED_PATCH_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      patch[field] = body[field];
    }
  }

  if (!Object.keys(patch).length) {
    return null;
  }

  patch.updated_at = new Date().toISOString();

  return patch;
}

export async function GET(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const universeId = normalizeUniverseId(resolvedParams?.id);

  if (!universeId) {
    return jsonResponse({ ok: false, error: "A universe id is required." }, 400);
  }

  try {
    const client = createAdminStoreClient();

    if (!client) {
      throw new Error("Supabase environment variables are missing.");
    }

    const [universeResult, assignedDollsResult, unassignedDollsResult] =
      await Promise.all([
        client.from("universes").select("*").eq("id", universeId).single(),
        client
          .from("dolls")
          .select("id, name, theme_name, slug, hero_image_url, universe_id")
          .eq("universe_id", universeId)
          .order("name", { ascending: true }),
        client
          .from("dolls")
          .select("id, name, theme_name, slug, hero_image_url, universe_id")
          .is("universe_id", null)
          .order("name", { ascending: true }),
      ]);

    if (universeResult.error) {
      if (universeResult.error.code === "PGRST116") {
        return jsonResponse({ ok: false, error: "Universe not found." }, 404);
      }
      throw universeResult.error;
    }

    return jsonResponse({
      ok: true,
      data: {
        universe: universeResult.data,
        assignedDolls: assignedDollsResult.error
          ? []
          : assignedDollsResult.data || [],
        unassignedDolls: unassignedDollsResult.error
          ? []
          : unassignedDollsResult.data || [],
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load universe detail.",
      },
      500
    );
  }
}

export async function PATCH(request, { params }) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const resolvedParams = await params;
  const universeId = normalizeUniverseId(resolvedParams?.id);

  if (!universeId) {
    return jsonResponse({ ok: false, error: "A universe id is required." }, 400);
  }

  const body = await request.json().catch(() => null);
  const patch = readUniversePatchPayload(body);

  if (!patch) {
    return jsonResponse(
      { ok: false, error: "No valid fields provided for update." },
      400
    );
  }

  try {
    const client = createAdminStoreClient();

    if (!client) {
      throw new Error("Supabase environment variables are missing.");
    }

    const { data, error } = await client
      .from("universes")
      .update(patch)
      .eq("id", universeId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({ ok: true, data: { universe: data } });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update universe.",
      },
      500
    );
  }
}
