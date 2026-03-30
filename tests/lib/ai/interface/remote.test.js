import { describe, expect, it, vi } from "vitest";
import { createGenerateStoryCommand } from "../../../../lib/shared/contracts";
import { AI_SERVICE_ERROR_CODES } from "../../../../lib/ai/interface/errors";
import { createRemoteAIService } from "../../../../lib/ai/interface/remote";

describe("AI remote interface service", () => {
  it("maps remote request/response payloads and preserves request ids", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          requestId: "req_story",
          code: "AI_GENERATION_COMPLETED",
          message: "AI content generated.",
          data: {
            task: "story",
            provider: "anthropic",
            result: {
              story_main: "Rosie explored the moonlit garden.",
            },
          },
          trace: {
            requestId: "req_story",
            executionMode: "service_http",
            task: "story",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );
    const service = createRemoteAIService({
      fetcher,
      aiServiceBaseUrl: "http://127.0.0.1:4100",
      aiServiceTimeoutMs: 5000,
    });

    const result = await service.generateStory({
      command: createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
        metadata: {
          provider: "anthropic",
          requestId: "req_story",
          correlationId: "corr_story",
        },
      }),
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:4100/generate/story",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-request-id": "req_story",
        }),
      })
    );
    expect(result).toMatchObject({
      ok: true,
      requestId: "req_story",
      data: {
        task: "story",
        provider: "anthropic",
        result: {
          story_main: "Rosie explored the moonlit garden.",
        },
      },
      trace: {
        requestId: "req_story",
        executionMode: "service_http",
        task: "story",
      },
    });
  });

  it("maps remote transport failures to stable AI error codes", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    });
    const service = createRemoteAIService({
      fetcher,
      aiServiceBaseUrl: "http://127.0.0.1:4100",
    });

    const result = await service.generateStory({
      command: createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE,
    });
  });
});
