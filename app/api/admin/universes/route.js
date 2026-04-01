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

function readCreateUniversePayload(body) {
  const name =
    typeof body?.name === "string" ? body.name.trim() : "";
  const slug =
    typeof body?.slug === "string" ? body.slug.trim() : "";

  if (!name || !slug) {
    return null;
  }

  return {
    name,
    slug,
    description:
      typeof body?.description === "string" ? body.description.trim() : null,
    emotional_core:
      typeof body?.emotional_core === "string"
        ? body.emotional_core.trim()
        : null,
    tone_rules:
      body?.tone_rules && typeof body.tone_rules === "object" &&
      !Array.isArray(body.tone_rules)
        ? body.tone_rules
        : {},
    visual_theme:
      body?.visual_theme && typeof body.visual_theme === "object" &&
      !Array.isArray(body.visual_theme)
        ? body.visual_theme
        : {},
    audio_urls:
      body?.audio_urls && typeof body.audio_urls === "object" &&
      !Array.isArray(body.audio_urls)
        ? body.audio_urls
        : {},
    status:
      typeof body?.status === "string" && body.status.trim()
        ? body.status.trim()
        : "active",
  };
}

export async function GET() {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  try {
    const client = createAdminStoreClient();

    if (!client) {
      throw new Error("Supabase environment variables are missing.");
    }

    const [universesResult, dollsResult] = await Promise.all([
      client
        .from("universes")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true }),
      client.from("dolls").select("id, universe_id"),
    ]);

    if (universesResult.error) {
      throw universesResult.error;
    }

    const universes = universesResult.data || [];
    const dolls = dollsResult.error ? [] : dollsResult.data || [];

    const dollCountByUniverse = dolls.reduce((acc, doll) => {
      if (doll.universe_id) {
        acc[doll.universe_id] = (acc[doll.universe_id] || 0) + 1;
      }
      return acc;
    }, {});

    const universesWithCount = universes.map((universe) => ({
      ...universe,
      doll_count: dollCountByUniverse[universe.id] || 0,
    }));

    return jsonResponse({
      ok: true,
      data: { universes: universesWithCount },
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load universes.",
      },
      500
    );
  }
}

export async function POST(request) {
  const sessionState = await readAuthenticatedSessionState();

  if (!sessionState.authenticated) {
    return unauthorizedResponse(sessionState.shouldClearCookie);
  }

  const body = await request.json().catch(() => null);
  const payload = readCreateUniversePayload(body);

  if (!payload) {
    return jsonResponse(
      { ok: false, error: "name and slug are required." },
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
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({ ok: true, data: { universe: data } }, 201);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create universe.",
      },
      500
    );
  }
}
