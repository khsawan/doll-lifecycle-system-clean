import { describe, expect, it } from "vitest";
import {
  normalizeAIExecutionResult,
  normalizeAIResponse,
  normalizeV1ContentResponse,
} from "../../../../lib/ai/domain/results";

describe("AI result normalization", () => {
  it("normalizes structured story variations", () => {
    const result = normalizeAIResponse({
      provider: "anthropic",
      task: "story",
      responseText: JSON.stringify({
        variations: [
          {
            id: "hero_story",
            label: "Hero Story",
            story_main: "Rosie explored the garden.",
          },
        ],
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      task: "story",
      provider: "anthropic",
      result: {
        story_main: "Rosie explored the garden.",
        variations: [
          {
            id: "hero_story",
            label: "Hero Story",
            story_main: "Rosie explored the garden.",
          },
        ],
      },
    });
  });

  it("normalizes V1 content into the managed-content shape", () => {
    const result = normalizeV1ContentResponse(
      JSON.stringify({
        intro_script: "Hello there",
        story_pages: ["One", "Two"],
        play_activity: {
          prompt: "Choose",
          choices: [{ id: "c1", label: "Wave", result_text: "Rosie waves." }],
        },
      })
    );

    expect(result).toEqual({
      intro_script: "Hello there",
      story_pages: ["One", "Two", "", ""],
      play_activity: {
        prompt: "Choose",
        choices: [
          { id: "c1", label: "Wave", result_text: "Rosie waves." },
          { id: "choice_2", label: "", result_text: "" },
          { id: "choice_3", label: "", result_text: "" },
        ],
      },
    });
  });

  it("wraps normalized execution output in the shared AI success shape", () => {
    const result = normalizeAIExecutionResult({
      provider: "anthropic",
      task: "social",
      responseText: JSON.stringify({
        social_hook: "Meet Rosie.",
        social_caption: "Rosie brings warmth.",
        social_cta: "See more",
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      task: "social",
      provider: "anthropic",
      data: {
        task: "social",
        provider: "anthropic",
      },
      result: {
        social_hook: "Meet Rosie.",
        social_caption: "Rosie brings warmth.",
        social_cta: "See more",
      },
    });
  });
});
