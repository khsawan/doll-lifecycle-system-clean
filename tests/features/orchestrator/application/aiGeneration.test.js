import { describe, expect, it, vi } from "vitest";
import {
  createGenerateContentPackCommand,
  createGenerateSocialCommand,
  createGenerateStoryCommand,
} from "../../../../lib/shared/contracts";
import { generateContentPack } from "../../../../features/orchestrator/application/generateContentPack";
import { generateSocial } from "../../../../features/orchestrator/application/generateSocial";
import { generateStory } from "../../../../features/orchestrator/application/generateStory";

describe("application orchestrator AI actions", () => {
  it("generates story content through the shared story action", async () => {
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
      requestId: expect.any(String),
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "story",
        provider: "anthropic",
        result: {
          story_main: "Rosie explored the moonlit garden.",
        },
      },
    });

    expect(generateAIContent).toHaveBeenCalledWith({
      provider: "anthropic",
      task: "story",
      payload: { name: "Rosie" },
    });
  });

  it("generates content-pack content through the shared content-pack action", async () => {
    const generateAIContent = vi.fn(async () => ({
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
        context: { generateAIContent },
      })
    ).resolves.toMatchObject({
      ok: true,
      requestId: expect.any(String),
      data: {
        task: "content_pack",
        provider: "anthropic",
        result: {
          short_intro: "Meet Rosie.",
        },
      },
    });
  });

  it("generates social content through the shared social action", async () => {
    const generateAIContent = vi.fn(async () => ({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "social",
        provider: "anthropic",
        result: {
          social_hook: "A tiny handmade companion.",
        },
      },
    }));

    await expect(
      generateSocial({
        command: createGenerateSocialCommand({
          dollId: "doll-1",
          payload: { name: "Rosie" },
        }),
        context: { generateAIContent },
      })
    ).resolves.toMatchObject({
      ok: true,
      requestId: expect.any(String),
      data: {
        task: "social",
        provider: "anthropic",
        result: {
          social_hook: "A tiny handmade companion.",
        },
      },
    });
  });

  it("returns a normalized failure when the wrong command type is used", async () => {
    await expect(
      generateStory({
        command: createGenerateSocialCommand({
          dollId: "doll-1",
          payload: { name: "Rosie" },
        }),
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "AI_INVALID_REQUEST",
      message: "Invalid story generation command.",
    });
  });
});
