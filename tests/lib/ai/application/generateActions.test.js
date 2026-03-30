import { describe, expect, it, vi } from "vitest";
import {
  createGenerateContentPackCommand,
  createGenerateSocialCommand,
  createGenerateStoryCommand,
} from "../../../../lib/shared/contracts";
import {
  generateContentPack,
  generateSocial,
  generateStory,
} from "../../../../lib/ai/application";

describe("AI application actions", () => {
  it("supports command-driven story generation through generateAIContent injection", async () => {
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

    await expect(
      generateStory({
        command: createGenerateStoryCommand({
          dollId: "doll-1",
          payload: { name: "Rosie" },
          metadata: { provider: "anthropic" },
        }),
        context: { generateAIContent },
      })
    ).resolves.toMatchObject({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      data: {
        task: "story",
        provider: "anthropic",
        result: {
          story_main: "Rosie explored the moonlit garden.",
        },
      },
    });
  });

  it("supports execution through an injected executeAIRequest seam", async () => {
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

    await expect(
      generateContentPack({
        command: createGenerateContentPackCommand({
          dollId: "doll-1",
          payload: { name: "Rosie" },
        }),
        context: { executeAIRequest },
      })
    ).resolves.toMatchObject({
      ok: true,
      data: {
        task: "content_pack",
        provider: "anthropic",
        result: {
          short_intro: "Meet Rosie.",
        },
      },
    });

    expect(executeAIRequest).toHaveBeenCalledWith({
      task: "content_pack",
      provider: "",
      payload: { name: "Rosie" },
      model: "",
    });
  });

  it("returns a normalized failure for invalid command types", async () => {
    await expect(
      generateSocial({
        command: createGenerateStoryCommand({
          dollId: "doll-1",
          payload: { name: "Rosie" },
        }),
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "INVALID_AI_GENERATION_COMMAND",
      message: "Invalid social generation command.",
    });
  });
});
