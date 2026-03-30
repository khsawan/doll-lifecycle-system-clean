import { describe, expect, it } from "vitest";
import {
  normalizePublicExperienceSlug,
  resolvePublicExperienceLoadError,
} from "../../../../features/public-experience/hooks/usePublicExperiencePageController";

describe("public experience page controller helpers", () => {
  it("normalizes route params into a slug string", () => {
    expect(normalizePublicExperienceSlug({ slug: "rosie" })).toBe("rosie");
    expect(normalizePublicExperienceSlug({ slug: ["luna", "extra"] })).toBe("luna");
    expect(normalizePublicExperienceSlug({})).toBe("");
  });

  it("resolves load errors into a user-facing message", () => {
    expect(resolvePublicExperienceLoadError(new Error("Missing doll"))).toBe("Missing doll");
    expect(resolvePublicExperienceLoadError("unexpected")).toBe(
      "We could not load this doll page right now."
    );
  });
});
