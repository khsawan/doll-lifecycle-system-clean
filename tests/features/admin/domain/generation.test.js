import { describe, expect, it } from "vitest";
import {
  buildAdminAIGenerationPayload,
  buildAdminManagedContentGenerationPayload,
} from "../../../../features/admin/domain/generation";

describe("admin generation payload helpers", () => {
  it("builds AI generation payloads from live identity edits before saved doll fields", () => {
    const payload = buildAdminAIGenerationPayload({
      selected: {
        name: "Saved Rosie",
        theme_name: "Nature Friends",
        personality_traits: "curious",
        emotional_hook: "saved hook",
        expression_feel: "bright",
        character_world: "saved meadow",
        color_palette: "pink",
        notable_features: "saved bow",
        universe_name: "Story Garden",
        universe_description: "A quiet place full of flowers.",
      },
      identity: {
        name: "Rosie Bloom",
        theme_name: "Bloom Club",
        personality_traits: "gentle, brave",
        emotional_hook: "helps little moments feel safe",
        expression_feel: "calm",
        character_world: "the blossom path",
        color_palette: "rose, cream",
        notable_features: "knit cardigan",
        short_intro: "Rosie notices beauty in quiet places.",
      },
      tone: "Magical",
    });

    expect(payload).toEqual({
      name: "Rosie Bloom",
      theme_name: "Bloom Club",
      personality_traits: "gentle, brave",
      emotional_hook: "helps little moments feel safe",
      expression_feel: "calm",
      character_world: "the blossom path",
      color_palette: "rose, cream",
      notable_features: "knit cardigan",
      universe: {
        name: "Story Garden",
        description: "A quiet place full of flowers.",
        tone: "Magical",
        environment_description: "the blossom path",
      },
    });
  });

  it("preserves an existing universe object when building AI generation payloads", () => {
    const universe = { name: "Moon Garden", tone: "Playful" };
    const payload = buildAdminAIGenerationPayload({
      selected: {
        theme_name: "Nature Friends",
        universe,
      },
      identity: {},
      tone: "Gentle",
    });

    expect(payload.universe).toBe(universe);
  });

  it("adds managed-content world, mood, and personality fallbacks", () => {
    const payload = buildAdminManagedContentGenerationPayload({
      selected: {
        theme_name: "Unassigned",
        emotional_hook: "softly reassuring",
      },
      identity: {
        personality_traits: "kind",
        expression_feel: "",
        character_world: "",
      },
    });

    expect(payload.personality).toBe("kind");
    expect(payload.world).toBe("a gentle little world");
    expect(payload.mood).toBe("softly reassuring");
  });
});
