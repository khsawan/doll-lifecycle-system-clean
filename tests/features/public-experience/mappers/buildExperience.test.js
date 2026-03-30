import { describe, expect, it } from "vitest";
import { buildV1Experience } from "../../../../features/public-experience/mappers/buildExperience";

describe("buildV1Experience", () => {
  it("builds a generic experience from persisted doll and story data", () => {
    const experience = buildV1Experience({
      dollRow: {
        id: 7,
        slug: "luna",
        name: "Luna",
        theme_name: "Forest Friends",
        universe_name: "Forest Friends",
        short_intro: "A calm little doll from the woods.",
        emotional_hook: "She helps shy friends feel brave.",
        image_url: "/images/dolls/luna/hero.png",
        personality_traits: "gentle, curious, kind",
        character_world: "A quiet mossy forest",
      },
      storyRows: [
        { type: "teaser", content: "Luna peeks out from the fern path." },
        { type: "main", content: "She follows the breeze to a hidden clearing." },
        { type: "mini", content: "She listens before she speaks." },
        { type: "mini", content: "She always leaves room for one more friend." },
      ],
      relatedDollRows: [
        {
          id: 8,
          slug: "milo",
          name: "Milo",
          short_intro: "A cheerful forest friend.",
          emotional_hook: "He loves helping others.",
          image_url: "/images/dolls/milo/hero.png",
          theme_name: "Forest Friends",
        },
      ],
    });

    expect(experience.version).toBe("v1");
    expect(experience.universe.name).toBe("Forest Friends");
    expect(experience.doll).toMatchObject({
      id: "7",
      slug: "luna",
      name: "Luna",
      hero_image_url: "/images/dolls/luna/hero.png",
      personality_traits: ["gentle", "curious", "kind"],
    });
    expect(experience.scenes.find((scene) => scene.id === "story")?.story_media?.pages).toHaveLength(
      4
    );
    expect(
      experience.scenes.find((scene) => scene.id === "meet_friends")?.related_characters
    ).toHaveLength(1);
  });

  it("preserves the current Rosie-specific story override", () => {
    const experience = buildV1Experience({
      dollRow: {
        id: 1,
        slug: "rosie",
        name: "Rosie",
        theme_name: "Nature Friends",
      },
      storyRows: [],
      relatedDollRows: [],
    });

    const storyScene = experience.scenes.find((scene) => scene.id === "story");

    expect(experience.doll.hero_image_url).toBe("/images/dolls/rosie/rosie-hero.png");
    expect(storyScene?.story_media?.pages).toHaveLength(4);
    expect(storyScene?.story_media?.pages?.[0]?.id).toBe("page-1");
    expect(storyScene?.story_media?.pages?.[0]?.image_url).toBe(
      "/images/dolls/rosie/rosie-story-1.png"
    );
  });

  it("creates a fallback story page when no story rows exist", () => {
    const experience = buildV1Experience({
      dollRow: {
        id: 3,
        slug: "nora",
        name: "Nora",
        short_intro: "Nora tiptoes into a brand-new little adventure.",
        emotional_hook: "A tiny friend with a brave heart.",
      },
      storyRows: [],
      relatedDollRows: [],
    });

    const storyScene = experience.scenes.find((scene) => scene.id === "story");

    expect(storyScene?.story_media?.pages).toHaveLength(1);
    expect(storyScene?.story_media?.pages?.[0]).toMatchObject({
      id: "fallback-story",
      text: "Nora tiptoes into a brand-new little adventure.",
    });
  });
});
