import { NextResponse } from "next/server";
import { generateAIContent } from "../../../../lib/ai";

function badRequest(message) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, task, payload } = body || {};

    if (typeof provider !== "string" || !provider.trim()) {
      return badRequest("Missing provider.");
    }

    if (typeof task !== "string" || !task.trim()) {
      return badRequest("Missing task.");
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return badRequest("Missing or invalid payload.");
    }

    const result = await generateAIContent({
      provider: provider.trim(),
      task: task.trim(),
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate AI content.";
    const status = /missing|invalid|unsupported/i.test(message) ? 400 : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
