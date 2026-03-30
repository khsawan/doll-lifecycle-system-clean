import { describe, expect, it } from "vitest";
import { getPublicExperienceFixture } from "../../../../features/public-experience/fixtures/rosie";

describe("Rosie public-experience fixture", () => {
  it("returns the Rosie override for normalized Rosie slugs", () => {
    const fixture = getPublicExperienceFixture(" Rosie ");

    expect(fixture).toMatchObject({
      slug: "rosie",
      doll: {
        hero_image_url: "/images/dolls/rosie/rosie-hero.png",
      },
    });
    expect(fixture.story_pages).toHaveLength(4);
  });

  it("returns fresh copies so story pages are not shared across callers", () => {
    const first = getPublicExperienceFixture("rosie");
    const second = getPublicExperienceFixture("rosie");

    first.story_pages[0].text = "changed";

    expect(second.story_pages[0].text).toBe(
      "Rosie stepped into the quiet farmyard, where soft morning light touched the wooden fence and little chickens wandered gently through the grass."
    );
  });

  it("returns null for dolls without explicit public fixtures", () => {
    expect(getPublicExperienceFixture("luna")).toBeNull();
  });
});
