import { describe, expect, it, vi } from "vitest";
import { createGenerateStoryCommand } from "../../../../lib/shared/contracts";
import { AI_SERVICE_ERROR_CODES } from "../../../../lib/ai/interface/errors";
import { createConfiguredAIService } from "../../../../lib/ai/interface/factory";

describe("AI interface factory", () => {
  it("uses the local adapter by default", async () => {
    const localAIService = {
      generateStory: vi.fn(async () => ({
        ok: true,
        requestId: "req_local",
        code: "AI_GENERATION_COMPLETED",
        message: "AI content generated.",
        data: {
          task: "story",
          provider: "anthropic",
          result: {
            story_main: "Local Rosie story.",
          },
        },
      })),
    };
    const remoteAIService = {
      generateStory: vi.fn(async () => ({
        ok: true,
      })),
    };
    const service = createConfiguredAIService({
      localAIService,
      remoteAIService,
    });

    const result = await service.generateStory({
      command: createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
      }),
    });

    expect(localAIService.generateStory).toHaveBeenCalledTimes(1);
    expect(remoteAIService.generateStory).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      requestId: "req_local",
    });
  });

  it("uses the remote adapter when remote mode is enabled", async () => {
    const localAIService = {
      generateStory: vi.fn(),
    };
    const remoteAIService = {
      generateStory: vi.fn(async () => ({
        ok: true,
        requestId: "req_remote",
        code: "AI_GENERATION_COMPLETED",
        message: "AI content generated.",
        data: {
          task: "story",
          provider: "anthropic",
          result: {
            story_main: "Remote Rosie story.",
          },
        },
      })),
    };
    const service = createConfiguredAIService({
      localAIService,
      remoteAIService,
    });

    const result = await service.generateStory({
      command: createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
      }),
      context: {
        aiServiceMode: "remote",
        aiServiceBaseUrl: "http://127.0.0.1:4100",
      },
    });

    expect(remoteAIService.generateStory).toHaveBeenCalledTimes(1);
    expect(localAIService.generateStory).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      requestId: "req_remote",
    });
  });

  it("can fall back to local execution when the remote adapter is unavailable", async () => {
    const localAIService = {
      generateStory: vi.fn(async () => ({
        ok: true,
        requestId: "req_local",
        code: "AI_GENERATION_COMPLETED",
        message: "AI content generated.",
        warnings: [],
        data: {
          task: "story",
          provider: "anthropic",
          result: {
            story_main: "Fallback Rosie story.",
          },
        },
        trace: {
          requestId: "req_local",
          executionMode: "in_process",
          task: "story",
        },
      })),
    };
    const remoteAIService = {
      generateStory: vi.fn(async () => ({
        ok: false,
        requestId: "req_remote",
        code: AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE,
        message: "Failed to generate story.",
        retryable: true,
      })),
    };
    const service = createConfiguredAIService({
      localAIService,
      remoteAIService,
    });

    const result = await service.generateStory({
      command: createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
      }),
      context: {
        aiServiceMode: "remote",
        aiServiceBaseUrl: "http://127.0.0.1:4100",
        aiServiceAllowLocalFallback: true,
      },
    });

    expect(remoteAIService.generateStory).toHaveBeenCalledTimes(1);
    expect(localAIService.generateStory).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      requestId: "req_local",
      warnings: ["Remote AI service failed; local fallback used."],
      trace: {
        primaryMode: "remote",
        fallbackMode: "local",
        remoteErrorCode: AI_SERVICE_ERROR_CODES.PROVIDER_UNAVAILABLE,
      },
    });
  });
});
