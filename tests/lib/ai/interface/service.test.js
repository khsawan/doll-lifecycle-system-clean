import { describe, expect, it, vi } from "vitest";
import { createGenerateStoryCommand } from "../../../../lib/shared/contracts";
import { generateStory } from "../../../../lib/ai/interface/service";
import { createGenerateContentPackRequest } from "../../../../lib/ai/interface/requests";
import { AI_SERVICE_ERROR_CODES } from "../../../../lib/ai/interface/errors";

describe("AI interface service", () => {
  it("propagates request ids and trace metadata on successful command execution", async () => {
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

    const result = await generateStory({
      command: createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
        metadata: {
          provider: "anthropic",
          requestId: "req_story",
          correlationId: "corr_story",
          requestSource: "admin_route",
        },
      }),
      context: { generateAIContent },
    });

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
        executionMode: "in_process",
        task: "story",
        provider: "anthropic",
        dollId: "doll-1",
        correlationId: "corr_story",
        requestSource: "admin_route",
      },
    });
  });

  it("supports request-dto execution without changing application behavior", async () => {
    const executeAIRequest = vi.fn(async () => ({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "content_pack",
        provider: "anthropic",
        result: {
          short_intro: "Meet Rosie.",
        },
      },
    }));

    const service = await import("../../../../lib/ai/interface/service");
    const result = await service.generateContentPack({
      request: createGenerateContentPackRequest({
        requestId: "req_content",
        entityId: "doll-2",
        payload: { name: "Rosie" },
        metadata: { provider: "anthropic" },
      }),
      context: { executeAIRequest },
    });

    expect(result).toMatchObject({
      ok: true,
      requestId: "req_content",
      data: {
        task: "content_pack",
        provider: "anthropic",
        result: {
          short_intro: "Meet Rosie.",
        },
      },
    });
  });

  it("maps invalid command input to a stable AI error code", async () => {
    const result = await generateStory({
      command: { type: "bad" },
    });

    expect(result).toMatchObject({
      ok: false,
      code: AI_SERVICE_ERROR_CODES.INVALID_REQUEST,
      message: "Invalid story generation command.",
    });
  });
});
