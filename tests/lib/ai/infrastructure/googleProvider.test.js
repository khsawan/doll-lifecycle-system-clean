import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();
const getGenerativeModel = vi.fn(() => ({
  generateContent,
}));
const GoogleGenerativeAI = vi.fn(function GoogleGenerativeAI() {
  return {
    getGenerativeModel,
  };
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI,
}));

describe("Google AI provider", () => {
  beforeEach(() => {
    vi.resetModules();
    generateContent.mockReset();
    getGenerativeModel.mockClear();
    GoogleGenerativeAI.mockClear();
    delete process.env.GOOGLE_AI_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized text/raw output through the Google SDK", async () => {
    process.env.GOOGLE_AI_API_KEY = "google-key";
    const rawResponse = {
      text: vi.fn(() => '{"story_main":"Rosie explored the moonlit garden."}'),
    };
    generateContent.mockResolvedValue({
      response: rawResponse,
    });

    const { generateWithGoogle } = await import(
      "../../../../lib/ai/infrastructure/providers/google.js"
    );
    const result = await generateWithGoogle({
      prompt: "Tell a story about Rosie",
      task: "story",
      model: "gemini-1.5-flash",
    });

    expect(GoogleGenerativeAI).toHaveBeenCalledWith("google-key");
    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-flash-latest",
    });
    expect(generateContent).toHaveBeenCalledWith("Tell a story about Rosie");
    expect(result).toEqual({
      text: '{"story_main":"Rosie explored the moonlit garden."}',
      raw: rawResponse,
    });
  });

  it("throws when the Google API key is missing or invalid", async () => {
    const { generateWithGoogle } = await import(
      "../../../../lib/ai/infrastructure/providers/google.js"
    );

    await expect(
      generateWithGoogle({
        prompt: "- Name: Rosie",
        task: "story",
        model: "",
      })
    ).rejects.toThrow("GOOGLE_AI_API_KEY missing or invalid");

    expect(GoogleGenerativeAI).not.toHaveBeenCalled();
  });
});
