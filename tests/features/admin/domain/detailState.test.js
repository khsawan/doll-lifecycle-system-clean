import { describe, expect, it } from "vitest";
import {
  buildAdminDollDetailState,
  resolveActiveGeneratedV1Content,
} from "../../../../features/admin/domain/detailState";

describe("admin detail-state mapper", () => {
  it("prefers local generated content over persisted rows when building editor state", () => {
    const detailState = buildAdminDollDetailState({
      doll: {
        id: 1,
        name: "Rosie",
        theme_name: "Nature Friends",
        short_intro: "Persisted intro",
        social_hook: "Saved hook",
        social_status: "draft",
        image_url: "/images/rosie.png",
        commerce_status: "ready_for_sale",
        qr_code_url: "https://example.com/qr.png",
      },
      localGeneratedContent: {
        intro_script: "Generated intro",
        story_pages: ["Generated teaser", "Generated main", "Generated mini 1", "Generated mini 2"],
        play_activity: {
          prompt: "What should Rosie do?",
          choices: [{ id: "a", label: "Wave", result_text: "Rosie waves." }],
        },
      },
      stories: [
        { type: "teaser", content: "Persisted teaser" },
        { type: "main", content: "Persisted main" },
      ],
      contentRows: [{ type: "promo_hook", content: "Promo hook" }],
      orders: [{ customer_name: "Layla", contact_info: "layla@example.com" }],
    });

    expect(detailState.commerceStatus).toBe("ready_for_sale");
    expect(detailState.identity?.short_intro).toBe("Generated intro");
    expect(detailState.story).toMatchObject({
      teaser: "Generated teaser",
      mainStory: "Generated main",
    });
    expect(detailState.savedStorySnapshot).toMatchObject({
      teaser: "Persisted teaser",
      mainStory: "Persisted main",
    });
    expect(detailState.contentPack).toMatchObject({
      hook: "Promo hook",
    });
    expect(detailState.order).toMatchObject({
      customer_name: "Layla",
      contact_info: "layla@example.com",
    });
    expect(detailState.playActivity.prompt).toBe("What should Rosie do?");
  });

  it("falls back to persisted generated content when local generated content is absent", () => {
    const activeContent = resolveActiveGeneratedV1Content(
      {
        intro_script: "Persisted intro",
        story_pages: ["Page 1", "", "", ""],
        play_activity: { prompt: "Prompt", choices: [] },
      },
      null
    );

    expect(activeContent).toMatchObject({
      intro_script: "Persisted intro",
      story_pages: ["Page 1", "", "", ""],
    });
  });
});
