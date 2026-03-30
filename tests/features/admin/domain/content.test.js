import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT_MANAGEMENT_STATE } from "../../../../features/admin/constants/content";
import {
  buildAdminContentSectionState,
  buildContentPack,
  buildContentPackStateFromVariation,
  buildIdentityStateFromSocialVariation,
  buildEditablePlayActivityState,
  buildLocalContentManagementState,
  buildSectionSaveState,
  generateV1ContentFromIdentity,
  mergeV1GeneratedContentWithFallback,
  buildStoryPack,
  buildStoryStateFromVariation,
  normalizeCommerceStatus,
  readStoryVariationCandidates,
  slugify,
} from "../../../../features/admin/domain/content";

describe("admin content domain helpers", () => {
  it("normalizes unsupported commerce statuses back to draft", () => {
    expect(normalizeCommerceStatus("ready_for_sale")).toBe("ready_for_sale");
    expect(normalizeCommerceStatus(" READY_FOR_SALE ")).toBe("ready_for_sale");
    expect(normalizeCommerceStatus("unknown")).toBe("draft");
  });

  it("pads editable play activity choices to three stable slots", () => {
    const state = buildEditablePlayActivityState({
      prompt: "Choose an action",
      choices: [{ label: "Wave", result: "A new friend smiles back." }],
    });

    expect(state.prompt).toBe("Choose an action");
    expect(state.choices).toHaveLength(3);
    expect(state.choices[0]).toMatchObject({
      label: "Wave",
      result_text: "A new friend smiles back.",
    });
    expect(state.choices[1]).toMatchObject({
      label: "",
      result_text: "",
    });
  });

  it("marks content as generated when persisted generated fields already exist", () => {
    const state = buildLocalContentManagementState({
      generation_status: DEFAULT_CONTENT_MANAGEMENT_STATE.generation_status,
      intro_script: "Hello there",
      story_pages: ["Page 1", "", "", ""],
    });

    expect(state).toMatchObject({
      generation_status: "generated",
      review_status: "draft",
      publish_status: "hidden",
    });
  });

  it("keeps only valid story variations and assigns fallback ids", () => {
    const variations = readStoryVariationCandidates({
      variations: [
        { story_main: "First variation" },
        { id: "v-two", label: "Second", story_main: "Second variation" },
        { story_main: "Third variation" },
        { story_main: "" },
      ],
    });

    expect(variations).toHaveLength(3);
    expect(variations[0]).toMatchObject({ id: "v1", label: "Version 1" });
    expect(variations[1]).toMatchObject({ id: "v-two", label: "Second" });
    expect(variations[2]).toMatchObject({ id: "v3", label: "Version 3" });
  });

  it("builds a deterministic story pack and slug from doll identity data", () => {
    const pack = buildStoryPack(
      {
        name: "Rosie Bloom",
        theme_name: "Nature Friends",
        personality_traits: "gentle, curious, brave",
        emotional_hook: "Rosie helps little moments feel safe",
        short_intro: "Rosie notices the beauty in quiet places.",
      },
      "Gentle"
    );

    expect(slugify("Rosie Bloom")).toBe("rosie-bloom");
    expect(pack).toMatchObject({
      teaser: expect.stringContaining("Rosie Bloom"),
      mainStory: expect.stringContaining("Nature Friends"),
      slug: "rosie-bloom",
    });
  });

  it("builds content pack defaults from the doll story and public link", () => {
    const contentPack = buildContentPack(
      {
        name: "Rosie Bloom",
        theme_name: "Nature Friends",
        emotional_hook: "Rosie helps quiet moments feel special",
        short_intro: "Rosie is a handmade doll with a gentle story.",
        slug: "rosie-bloom",
      },
      {
        teaser: "Meet Rosie Bloom and step into her cozy world.",
      },
      "https://example.com"
    );

    expect(contentPack.caption).toContain("Rosie Bloom");
    expect(contentPack.caption).toContain("https://example.com/doll/rosie-bloom");
    expect(contentPack.hook).toContain("Nature Friends");
  });

  it("builds section save state labels and disabled state from snapshot comparisons", () => {
    expect(
      buildSectionSaveState({
        currentSnapshot: { teaser: "Hello" },
        savedSnapshot: { teaser: "Hello" },
        defaultLabel: "Save Story",
      })
    ).toEqual({
      dirty: false,
      saving: false,
      hasSavedSnapshot: true,
      disabled: true,
      label: "Saved",
    });

    expect(
      buildSectionSaveState({
        currentSnapshot: { teaser: "Hello" },
        savedSnapshot: { teaser: "Hi" },
        isSaving: true,
        defaultLabel: "Save Story",
      })
    ).toMatchObject({
      dirty: true,
      saving: true,
      disabled: true,
      label: "Saving...",
    });
  });

  it("builds grouped admin content section state with derived editor save states", () => {
    const setStoryTone = () => {};
    const setStory = () => {};
    const setIdentity = () => {};

    const contentSectionState = buildAdminContentSectionState({
      isContentEditable: true,
      hasStoryContent: true,
      storyTone: "Gentle",
      setStoryTone,
      applyTone: () => {},
      storyGenerating: false,
      saveStory: () => {},
      storyVariations: [{ id: "story-v1" }],
      selectedStoryVariationId: "story-v1",
      applyStoryVariationToEditor: () => {},
      story: {
        teaser: "Existing teaser",
        mainStory: "",
        mini1: "",
        mini2: "",
      },
      setStory,
      setSelectedStoryVariationId: () => {},
      savedStorySnapshot: {
        teaser: "Existing teaser",
        mainStory: "",
        mini1: "",
        mini2: "",
      },
      storySaving: false,
      hasContentAssets: true,
      generateContentPack: () => {},
      contentPackGenerating: false,
      saveContentPack: () => {},
      contentPackVariations: [{ id: "pack-v1" }],
      selectedContentPackVariationId: "pack-v1",
      applyContentPackVariationToEditor: () => {},
      contentPack: {
        caption: "Caption",
        hook: "Hook",
        blurb: "Blurb",
        cta: "CTA",
      },
      setContentPack: () => {},
      setSelectedContentPackVariationId: () => {},
      savedContentPackSnapshot: {
        caption: "Caption",
        hook: "Hook",
        blurb: "Blurb",
        cta: "CTA",
      },
      generateSocialContent: () => {},
      socialGenerating: false,
      saveIdentity: () => {},
      socialVariations: [{ id: "social-v1" }],
      selectedSocialVariationId: "social-v1",
      applySocialVariationToEditor: () => {},
      identity: {
        social_hook: "Hook",
        social_caption: "Caption",
        social_cta: "CTA",
        social_status: "draft",
      },
      setIdentity,
      setSelectedSocialVariationId: () => {},
      savedSocialSnapshot: {
        social_hook: "Hook",
        social_caption: "Caption",
        social_cta: "CTA",
        social_status: "draft",
      },
      socialSaving: false,
    });

    expect(contentSectionState.storySaveState).toMatchObject({
      dirty: false,
      disabled: true,
      label: "Saved",
    });
    expect(contentSectionState.contentPackSaveState.label).toBe("Saved");
    expect(contentSectionState.socialSaveState.label).toBe("Saved");
    expect(contentSectionState.setStoryTone).toBe(setStoryTone);
    expect(contentSectionState.setStory).toBe(setStory);
    expect(contentSectionState.setIdentity).toBe(setIdentity);
  });

  it("maps selected story and content variations into editor state", () => {
    expect(
      buildStoryStateFromVariation(
        {
          teaser: "Existing teaser",
          mainStory: "Existing story",
          mini1: "Existing mini 1",
          mini2: "Existing mini 2",
        },
        { id: "v2", story_main: "Updated main story" },
        {
          teaser: "Generated teaser",
          mini1: "Generated mini 1",
          mini2: "Generated mini 2",
        }
      )
    ).toEqual({
      teaser: "Generated teaser",
      mainStory: "Updated main story",
      mini1: "Generated mini 1",
      mini2: "Generated mini 2",
    });

    expect(
      buildContentPackStateFromVariation(
        {
          short_intro: "Short intro",
          promo_hook: "Promo hook",
          content_blurb: "Product blurb",
          cta: "Discover now",
        },
        {
          caption: "Old caption",
          hook: "Old hook",
          blurb: "Old blurb",
          cta: "Old CTA",
        }
      )
    ).toEqual({
      caption: "Short intro",
      hook: "Promo hook",
      blurb: "Product blurb",
      cta: "Discover now",
    });
  });

  it("maps selected social variations into identity state without dropping other fields", () => {
    expect(
      buildIdentityStateFromSocialVariation(
        {
          name: "Rosie",
          social_hook: "Old hook",
          social_caption: "Old caption",
          social_cta: "Old CTA",
          social_status: "draft",
        },
        {
          social_hook: "Fresh hook",
          social_caption: "Fresh caption",
          social_cta: "Fresh CTA",
        }
      )
    ).toEqual({
      name: "Rosie",
      social_hook: "Fresh hook",
      social_caption: "Fresh caption",
      social_cta: "Fresh CTA",
      social_status: "draft",
      });
  });

  it("fills generated V1 content gaps from deterministic identity defaults", () => {
    const fallback = generateV1ContentFromIdentity({
      name: "Rosie Bloom",
      personality: "kind, curious",
      world: "The Blossom Path",
      mood: "calm",
    });
    const merged = mergeV1GeneratedContentWithFallback(
      {
        intro_script: "  ",
        story_pages: ["", "Custom page", "", ""],
        play_activity: {
          prompt: "",
          choices: [{ label: "", result_text: "" }],
        },
      },
      fallback
    );

    expect(merged.intro_script).toBe(fallback.intro_script);
    expect(merged.story_pages[1]).toBe("Custom page");
    expect(merged.story_pages[0]).toBe(fallback.story_pages[0]);
    expect(merged.play_activity.prompt).toBe(fallback.play_activity.prompt);
    expect(merged.play_activity.choices[0].label).toBe(
      fallback.play_activity.choices[0].label
    );
  });
});
