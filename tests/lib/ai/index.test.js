import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createSettingsStoreClient = vi.fn();
const fetchSettingsValueMap = vi.fn();
const generateWithAnthropic = vi.fn();

vi.mock("../../../features/settings/services/settingsStore", () => ({
  createSettingsStoreClient,
  fetchSettingsValueMap,
}));

vi.mock("../../../lib/ai/providers/anthropic", () => ({
  generateWithAnthropic,
}));

describe("AI runtime settings loading", () => {
  beforeEach(() => {
    vi.resetModules();
    createSettingsStoreClient.mockReset();
    fetchSettingsValueMap.mockReset();
    generateWithAnthropic.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses shared settings-store defaults for AI provider configuration", async () => {
    createSettingsStoreClient.mockReturnValue({ client: true });
    fetchSettingsValueMap.mockResolvedValue({
      ai_provider: "anthropic",
      ai_model: "claude-custom",
    });
    generateWithAnthropic.mockResolvedValue(
      JSON.stringify({
        story_main: "Rosie explored the garden.",
      })
    );

    const { generateAIContent } = await import("../../../lib/ai/index.js");
    const result = await generateAIContent({
      task: "story",
      payload: { name: "Rosie" },
    });

    expect(fetchSettingsValueMap).toHaveBeenCalledWith(
      { client: true },
      ["ai_provider", "ai_model"]
    );
    expect(generateWithAnthropic).toHaveBeenCalledWith(
      expect.objectContaining({
        task: "story",
        model: "claude-custom",
      })
    );
    expect(result).toMatchObject({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      task: "story",
      provider: "anthropic",
      data: {
        task: "story",
        provider: "anthropic",
      },
      result: {
        story_main: "Rosie explored the garden.",
      },
    });
  });

  it("falls back cleanly when shared settings loading fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    createSettingsStoreClient.mockReturnValue({ client: true });
    fetchSettingsValueMap.mockRejectedValue(new Error("settings unavailable"));
    generateWithAnthropic.mockResolvedValue(
      JSON.stringify({
        story_main: "Rosie explored the garden.",
      })
    );

    const { generateAIContent } = await import("../../../lib/ai/index.js");
    const result = await generateAIContent({
      provider: "anthropic",
      task: "story",
      payload: { name: "Rosie" },
    });

    expect(generateWithAnthropic).toHaveBeenCalledWith(
      expect.objectContaining({
        task: "story",
        model: "",
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "Unable to load AI settings. settings unavailable"
    );
    expect(result.provider).toBe("anthropic");
    expect(result.code).toBe("AI_GENERATION_COMPLETED");
  });
});
