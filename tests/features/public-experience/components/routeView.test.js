import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PublicExperienceRouteView from "../../../../features/public-experience/components/PublicExperienceRouteView";

function ExperienceShell({ experience }) {
  return createElement("div", null, `Experience ${experience?.doll?.name}`);
}

describe("public experience route view", () => {
  it("renders the loading state while the experience is loading", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicExperienceRouteView, {
        loading: true,
        error: "",
        experience: null,
        ExperienceShell,
      })
    );

    expect(markup).toContain("Loading doll story...");
  });

  it("renders the error state when loading fails", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicExperienceRouteView, {
        loading: false,
        error: "This doll page could not be found.",
        experience: null,
        ExperienceShell,
      })
    );

    expect(markup).toContain("Doll page unavailable");
    expect(markup).toContain("This doll page could not be found.");
  });

  it("renders the experience shell when experience data is available", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicExperienceRouteView, {
        loading: false,
        error: "",
        experience: {
          doll: {
            name: "Rosie",
          },
        },
        ExperienceShell,
      })
    );

    expect(markup).toContain("Experience Rosie");
    expect(markup).toContain("publicExperienceWrap");
  });
});
