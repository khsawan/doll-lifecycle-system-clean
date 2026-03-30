import { describe, expect, it, vi } from "vitest";
import { createInProcessAIService } from "../../../lib/ai/interface/service";
import { handleAIServiceHttpRequest } from "../../../apps/ai-service/lib/http";

describe("AI service HTTP handler", () => {
  it("serves story generation through the isolated service endpoint", async () => {
    const generateAIContent = vi.fn(async () => ({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "story",
        provider: "anthropic",
        result: {
          story_main: "Rosie explored the moonlit garden.",
        },
      },
    }));
    const service = createInProcessAIService({ generateAIContent });

    const response = await handleAIServiceHttpRequest({
      method: "POST",
      pathname: "/generate/story",
      body: {
        requestId: "req_story",
        dollId: "doll-1",
        payload: { name: "Rosie" },
        metadata: { provider: "anthropic" },
      },
      service,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      requestId: "req_story",
      data: {
        task: "story",
        provider: "anthropic",
        result: {
          story_main: "Rosie explored the moonlit garden.",
        },
      },
    });
  });

  it("exposes a health endpoint", async () => {
    const response = await handleAIServiceHttpRequest({
      method: "GET",
      pathname: "/health",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      service: "ai-service",
      status: "healthy",
    });
  });
});
