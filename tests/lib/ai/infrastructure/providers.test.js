import { beforeEach, describe, expect, it, vi } from "vitest";
import { AI_PROVIDERS } from "../../../../lib/ai/domain/taskRouting.js";

const generateWithAnthropic = vi.fn();
const generateWithGoogle = vi.fn();

vi.mock("../../../../lib/ai/providers/anthropic.js", () => ({
  generateWithAnthropic,
}));

vi.mock("../../../../lib/ai/infrastructure/providers/google.js", () => ({
  generateWithGoogle,
}));

describe("AI provider registry", () => {
  beforeEach(() => {
    generateWithAnthropic.mockReset();
    generateWithGoogle.mockReset();
  });

  it("routes google requests to the Google provider", async () => {
    generateWithGoogle.mockResolvedValue({
      text: '{"story_main":"Rosie explored the moonlit garden."}',
      raw: { provider: "google" },
    });

    const { executeAIProviderRequest } = await import(
      "../../../../lib/ai/infrastructure/providers.js"
    );
    const result = await executeAIProviderRequest({
      provider: AI_PROVIDERS.GOOGLE,
      prompt: "Tell a story",
      task: "story",
      model: "",
    });

    expect(generateWithGoogle).toHaveBeenCalledWith({
      prompt: "Tell a story",
      task: "story",
      model: "",
    });
    expect(result).toEqual({
      text: '{"story_main":"Rosie explored the moonlit garden."}',
      raw: { provider: "google" },
    });
  });

  it("keeps anthropic requests routed to the Anthropic provider", async () => {
    generateWithAnthropic.mockResolvedValue('{"story_main":"Rosie explored the moonlit garden."}');

    const { executeAIProviderRequest } = await import(
      "../../../../lib/ai/infrastructure/providers.js"
    );
    const result = await executeAIProviderRequest({
      provider: AI_PROVIDERS.ANTHROPIC,
      prompt: "Tell a story",
      task: "story",
      model: "",
    });

    expect(generateWithAnthropic).toHaveBeenCalledWith({
      prompt: "Tell a story",
      task: "story",
      model: "",
    });
    expect(result).toBe('{"story_main":"Rosie explored the moonlit garden."}');
  });
});
