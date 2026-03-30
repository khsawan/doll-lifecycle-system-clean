import { beforeEach, describe, expect, it, vi } from "vitest";

describe("AI runtime provider selection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("prefers AI_PROVIDER from env over stored settings", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const executeAIProviderRequest = vi.fn(async () => ({
      text: '{"story_main":"Rosie explored the moonlit garden."}',
      raw: { provider: "google" },
    }));

    const { generateAIContent } = await import("../../../../lib/ai/infrastructure/runtime.js");
    const result = await generateAIContent(
      {
        task: "story",
        payload: { name: "Rosie" },
      },
      {
        env: { AI_PROVIDER: "google" },
        loadAISettings: async () => ({
          ai_provider: "anthropic",
          ai_model: "claude-settings",
        }),
        executeAIProviderRequest,
      }
    );

    expect(executeAIProviderRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        task: "story",
        model: "",
      })
    );
    expect(logSpy).toHaveBeenCalledWith("AI_PROVIDER:", "google");
    expect(logSpy).toHaveBeenCalledWith("HAS GOOGLE KEY:", false);
    expect(result).toMatchObject({
      ok: true,
      provider: "google",
      result: {
        story_main: "Rosie explored the moonlit garden.",
      },
    });
  });

  it("keeps accepting legacy string provider responses", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const executeAIProviderRequest = vi.fn(async () =>
      '{"social_hook":"Meet Rosie.","social_caption":"Rosie brings warmth.","social_cta":"See more"}'
    );

    const { generateAIContent } = await import("../../../../lib/ai/infrastructure/runtime.js");
    const result = await generateAIContent(
      {
        provider: "anthropic",
        task: "social",
        payload: { name: "Rosie" },
      },
      {
        executeAIProviderRequest,
        loadAISettings: async () => ({}),
      }
    );

    expect(executeAIProviderRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "anthropic",
        task: "social",
      })
    );
    expect(result).toMatchObject({
      ok: true,
      provider: "anthropic",
      result: {
        social_hook: "Meet Rosie.",
        social_caption: "Rosie brings warmth.",
        social_cta: "See more",
      },
    });
    expect(logSpy).not.toHaveBeenCalled();
  });
});
