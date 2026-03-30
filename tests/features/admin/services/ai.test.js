import { describe, expect, it } from "vitest";
import {
  generateAdminContentPack,
  generateAdminManagedContent,
  generateAdminSocialContent,
  generateAdminStory,
} from "../../../../features/admin/services/ai";

function createFetcher({ ok = true, body = {} } = {}) {
  return async () => ({
    ok,
    json: async () => body,
  });
}

describe("admin AI services", () => {
  it("builds a fallback story variation when the API returns only a single story", async () => {
    const result = await generateAdminStory(
      createFetcher({
        body: {
          result: {
            story_main: "Rosie explored the garden.",
          },
        },
      }),
      { name: "Rosie" }
    );

    expect(result.primaryVariation).toEqual({
      id: "v1",
      label: "Version 1",
      story_main: "Rosie explored the garden.",
    });
  });

  it("normalizes generated content-pack variations", async () => {
    const result = await generateAdminContentPack(
      createFetcher({
        body: {
          result: {
            short_intro: "Meet Rosie.",
            content_blurb: "Rosie is handmade.",
            promo_hook: "A gentle friend.",
            cta: "Discover Rosie",
            variations: [
              {
                short_intro: "Meet Rosie.",
                content_blurb: "Rosie is handmade.",
                promo_hook: "A gentle friend.",
                cta: "Discover Rosie",
              },
            ],
          },
        },
      }),
      { name: "Rosie" }
    );

    expect(result.variations).toHaveLength(1);
    expect(result.primaryVariation).toMatchObject({
      id: "v1",
      short_intro: "Meet Rosie.",
      promo_hook: "A gentle friend.",
    });
  });

  it("normalizes generated social variations", async () => {
    const result = await generateAdminSocialContent(
      createFetcher({
        body: {
          result: {
            social_hook: "A tiny handmade companion.",
            social_caption: "Rosie brings warmth to little moments.",
            social_cta: "See more",
          },
        },
      }),
      { name: "Rosie" }
    );

    expect(result.primaryVariation).toEqual({
      id: "v1",
      label: "Version 1",
      social_hook: "A tiny handmade companion.",
      social_caption: "Rosie brings warmth to little moments.",
      social_cta: "See more",
    });
  });

  it("reads contract-style AI route success payloads without changing callers", async () => {
    const result = await generateAdminStory(
      createFetcher({
        body: {
          ok: true,
          requestId: "req_story",
          trace: {
            executionMode: "in_process",
            task: "story",
          },
          code: "AI_GENERATION_COMPLETED",
          message: "AI content generated.",
          data: {
            task: "story",
            provider: "anthropic",
            result: {
              story_main: "Rosie explored the moonlit garden.",
            },
          },
        },
      }),
      { name: "Rosie" }
    );

    expect(result.primaryVariation).toEqual({
      id: "v1",
      label: "Version 1",
      story_main: "Rosie explored the moonlit garden.",
    });
  });

  it("accepts contract-style managed-content responses without triggering fallback", async () => {
    const fallbackContent = {
      intro_script: "Fallback intro",
      story_pages: ["Page 1", "Page 2", "Page 3", "Page 4"],
      play_activity: {
        prompt: "Choose",
        choices: [{ id: "c1", label: "Wave", result_text: "Rosie waves." }],
      },
    };

    const result = await generateAdminManagedContent(
      createFetcher({
        body: {
          ok: true,
          code: "AI_V1_CONTENT_GENERATED",
          message: "AI managed content generated.",
          data: {
            task: "v1_content",
            provider: "anthropic",
            result: {
              intro_script: "Fresh intro",
              story_pages: ["One", "Two", "Three", "Four"],
              play_activity: {
                prompt: "Pick a game",
                choices: [
                  { id: "c1", label: "Hop", result_text: "Rosie hops." },
                  { id: "c2", label: "Spin", result_text: "Rosie spins." },
                  { id: "c3", label: "Wave", result_text: "Rosie waves." },
                ],
              },
            },
          },
        },
      }),
      { name: "Rosie" },
      fallbackContent
    );

    expect(result.usedFallback).toBe(false);
    expect(result.generatedContent).toMatchObject({
      intro_script: "Fresh intro",
      story_pages: ["One", "Two", "Three", "Four"],
    });
  });

  it("falls back to deterministic managed content when AI generation fails", async () => {
    const fallbackContent = {
      intro_script: "Fallback intro",
      story_pages: ["Page 1", "Page 2", "Page 3", "Page 4"],
      play_activity: {
        prompt: "Choose",
        choices: [{ id: "c1", label: "Wave", result_text: "Rosie waves." }],
      },
    };

    const result = await generateAdminManagedContent(
      createFetcher({
        ok: false,
        body: {
          error: "service unavailable",
        },
      }),
      { name: "Rosie" },
      fallbackContent
    );

    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe("service unavailable");
    expect(result.generatedContent).toMatchObject({
      intro_script: "Fallback intro",
      story_pages: ["Page 1", "Page 2", "Page 3", "Page 4"],
    });
  });
});
