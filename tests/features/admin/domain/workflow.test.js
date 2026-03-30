import { describe, expect, it } from "vitest";
import { createDefaultPipelineState } from "../../../../lib/pipelineState";
import {
  buildPipelineStageBlockedMessage,
  buildReadiness,
  formatStatusToken,
  getPipelineProgressPercent,
  getPipelineStageReadinessState,
  isMissingPipelineStateColumnError,
  pipelineStageStateLabel,
  readinessMissingLabel,
  statusLabel,
  syncDollRecordPipelineState,
} from "../../../../features/admin/domain/workflow";

describe("admin workflow domain helpers", () => {
  it("formats workflow and commerce status labels consistently", () => {
    expect(statusLabel("live")).toBe("Sales");
    expect(statusLabel("story")).toBe("Story");
    expect(formatStatusToken("ready_for_sale")).toBe("Ready For Sale");
    expect(pipelineStageStateLabel("open")).toBe("In Progress");
  });

  it("detects the legacy missing pipeline column error shape", () => {
    expect(
      isMissingPipelineStateColumnError({
        message: 'Could not find the "pipeline_state" column in the schema cache',
      })
    ).toBe(true);
    expect(isMissingPipelineStateColumnError({ message: "some other database error" })).toBe(
      false
    );
  });

  it("builds gateway readiness guidance with the right missing label", () => {
    const readinessState = getPipelineStageReadinessState(
      "gateway",
      {
        digital: { complete: false, missing: ["slug"] },
        commercial: { complete: false, missing: ["commerce_status"] },
        overall: false,
      },
      {
        gateway: { complete: false, missing: ["commerce_status"] },
      }
    );

    expect(readinessState).toEqual({
      complete: false,
      missing: ["commerce_status"],
    });
    expect(readinessMissingLabel("commerce_status")).toContain("ready for sale");
    expect(buildPipelineStageBlockedMessage("gateway", readinessState)).toBe(
      "Complete Product Commerce readiness before completing Gateway. Product commerce status is not ready for sale."
    );
  });

  it("calculates pipeline progress from normalized pipeline state", () => {
    const pipelineState = createDefaultPipelineState("2026-03-28T10:00:00.000Z");
    const record = syncDollRecordPipelineState(
      {
        id: 1,
        created_at: "2026-03-28T10:00:00.000Z",
        pipeline_state: {
          ...pipelineState,
          registered: {
            ...pipelineState.registered,
            status: "completed",
            completedAt: "2026-03-28T10:05:00.000Z",
          },
          character: {
            ...pipelineState.character,
            status: "open",
          },
        },
      },
      {
        ...pipelineState,
        registered: {
          ...pipelineState.registered,
          status: "completed",
          completedAt: "2026-03-28T10:05:00.000Z",
        },
        character: {
          ...pipelineState.character,
          status: "open",
        },
      },
      { persisted: true }
    );

    expect(record.pipeline_state).toBeDefined();
    expect(getPipelineProgressPercent(record)).toBe(30);
  });

  it("computes readiness score and missing sections from form state", () => {
    const readiness = buildReadiness(
      {
        name: "Rosie",
        theme_name: "Nature Friends",
        personality_traits: "gentle, kind",
        emotional_hook: "Rosie comforts little friends",
        short_intro: "A calm handmade doll.",
      },
      {
        teaser: "Hello",
        mainStory: "Story",
        mini1: "Mini 1",
        mini2: "Mini 2",
      },
      {
        caption: "Caption",
        hook: "Hook",
        blurb: "Blurb",
        cta: "CTA",
      },
      {
        customer_name: "",
        contact_info: "",
        order_status: "new",
      },
      "https://example.com/doll/rosie"
    );

    expect(readiness.score).toBe(80);
    expect(readiness.missing).toEqual(["sales"]);
    expect(readiness.checks.digital).toBe(true);
  });
});
