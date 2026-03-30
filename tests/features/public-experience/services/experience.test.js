import { describe, expect, it } from "vitest";
import { fetchPublicExperienceData } from "../../../../features/public-experience/services/experience";

function createMockClient(resultsByTable) {
  const tableCallCounts = {};

  function nextResult(tableName) {
    const source = resultsByTable[tableName];
    if (Array.isArray(source)) {
      const index = tableCallCounts[tableName] || 0;
      tableCallCounts[tableName] = index + 1;
      return source[index] || {};
    }

    return source || {};
  }

  return {
    from(tableName) {
      const builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        neq() {
          return builder;
        },
        single() {
          return Promise.resolve(nextResult(tableName));
        },
        order() {
          return Promise.resolve(nextResult(tableName));
        },
        limit() {
          return Promise.resolve(nextResult(tableName));
        },
      };

      return builder;
    },
  };
}

describe("public experience service", () => {
  it("returns persisted doll and story rows with universe-related dolls", async () => {
    const client = createMockClient({
      dolls: [
        {
          data: {
            id: 7,
            slug: "luna",
            name: "Luna",
            universe_id: "forest-world",
            theme_name: "Forest Friends",
          },
        },
        {
          data: [
            {
              id: 8,
              slug: "milo",
              name: "Milo",
              short_intro: "A cheerful forest friend.",
            },
          ],
        },
      ],
      stories: [
        {
          data: [
            { type: "teaser", content: "Luna peeks out from the fern path." },
            { type: "main", content: "She follows the breeze to a hidden clearing." },
          ],
        },
      ],
    });

    await expect(fetchPublicExperienceData(client, "luna")).resolves.toEqual({
      dollRow: {
        id: 7,
        slug: "luna",
        name: "Luna",
        universe_id: "forest-world",
        theme_name: "Forest Friends",
      },
      storyRows: [
        { type: "teaser", content: "Luna peeks out from the fern path." },
        { type: "main", content: "She follows the breeze to a hidden clearing." },
      ],
      relatedDollRows: [
        {
          id: 8,
          slug: "milo",
          name: "Milo",
          short_intro: "A cheerful forest friend.",
        },
      ],
    });
  });

  it("supports wrapped result objects while still preferring real source data", async () => {
    const client = createMockClient({
      dolls: [
        {
          data: {
            data: {
              id: 11,
              slug: "mira",
              name: "Mira",
              universe_id: "moon-garden",
              theme_name: "Moon Garden",
            },
          },
        },
        {
          rows: [
            {
              id: 12,
              slug: "sol",
              name: "Sol",
            },
          ],
        },
      ],
      stories: [
        {
          rows: [
            { type: "teaser", content: "Mira follows a silver glow." },
          ],
        },
      ],
    });

    await expect(fetchPublicExperienceData(client, "mira")).resolves.toEqual({
      dollRow: {
        id: 11,
        slug: "mira",
        name: "Mira",
        universe_id: "moon-garden",
        theme_name: "Moon Garden",
      },
      storyRows: [{ type: "teaser", content: "Mira follows a silver glow." }],
      relatedDollRows: [
        {
          id: 12,
          slug: "sol",
          name: "Sol",
        },
      ],
    });
  });

  it("falls back to theme-related dolls when universe matches are empty", async () => {
    const client = createMockClient({
      dolls: [
        {
          data: {
            id: 9,
            slug: "nora",
            name: "Nora",
            universe_id: "quiet-garden",
            theme_name: "Garden Friends",
          },
        },
        { data: [] },
        {
          data: [
            {
              id: 10,
              slug: "ivy",
              name: "Ivy",
            },
          ],
        },
      ],
      stories: [{ data: [] }],
    });

    const result = await fetchPublicExperienceData(client, "nora");

    expect(result.relatedDollRows).toEqual([
      {
        id: 10,
        slug: "ivy",
        name: "Ivy",
      },
    ]);
  });

  it("throws a not found error when the doll slug does not resolve", async () => {
    const client = createMockClient({
      dolls: [{ data: null, error: { message: "not found" } }],
    });

    await expect(fetchPublicExperienceData(client, "missing-doll")).rejects.toThrow(
      "This doll page could not be found."
    );
  });
});
