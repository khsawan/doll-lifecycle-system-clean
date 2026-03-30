import { describe, expect, it } from "vitest";
import {
  buildOperationsBoardViewState,
  deriveDollOperationsModel,
  matchesOperationsFilter,
  operationsPassiveEmptyStateText,
  operationsQueueEmptyStateText,
  operationsWorkspaceButtonLabel,
  sortOperationsList,
} from "../../../../features/admin/domain/operations";

describe("admin operations domain helpers", () => {
  it("routes gateway-blocked dolls to the pipeline workspace with high urgency", () => {
    const operation = deriveDollOperationsModel(
      {
        id: 1,
        internal_id: "DOLL-001",
        name: "Rosie",
        status: "story",
        slug: "rosie",
        qr_code_url: "",
        commerce_status: "draft",
        updated_at: "2026-03-28T12:00:00.000Z",
        pipeline_state: {
          registered: { status: "completed" },
          character: { status: "completed" },
          content: { status: "completed" },
          gateway: { status: "open" },
          ready: { status: "locked" },
        },
      },
      {
        generation_status: "generated",
        review_status: "approved",
        publish_status: "hidden",
      }
    );

    expect(operation).toMatchObject({
      attention_type: "production",
      production_bucket: "blocked_in_gateway",
      recommended_workspace: "pipeline",
      next_action: "Generate QR",
      urgency: "high",
      needs_attention: true,
    });
  });

  it("routes ready-for-content dolls to content work when generated content is missing", () => {
    const operation = deriveDollOperationsModel({
      id: 2,
      internal_id: "DOLL-002",
      name: "Luna",
      status: "story",
      commerce_status: "ready_for_sale",
      slug: "luna",
      qr_code_url: "https://example.com/qr.png",
      updated_at: "2026-03-28T11:00:00.000Z",
      pipeline_state: {
        registered: { status: "completed" },
        character: { status: "completed" },
        content: { status: "open" },
        gateway: { status: "locked" },
        ready: { status: "locked" },
      },
    });

    expect(operation).toMatchObject({
      production_bucket: "ready_for_content_handoff",
      content_bucket: "needs_generation",
      attention_type: "content",
      recommended_workspace: "content_studio",
      next_action: "Generate content",
    });
  });

  it("sorts operations by urgency first and then recency", () => {
    const sorted = sortOperationsList(
      [
        {
          name: "Calm",
          internal_id: "DOLL-003",
          urgency: "low",
          updated_at: "2026-03-28T10:00:00.000Z",
        },
        {
          name: "Urgent",
          internal_id: "DOLL-001",
          urgency: "high",
          updated_at: "2026-03-28T09:00:00.000Z",
        },
        {
          name: "Review",
          internal_id: "DOLL-002",
          urgency: "medium",
          updated_at: "2026-03-28T11:00:00.000Z",
        },
      ],
      "urgency"
    );

    expect(sorted.map((item) => item.internal_id)).toEqual([
      "DOLL-001",
      "DOLL-002",
      "DOLL-003",
    ]);
  });

  it("matches the expected operations board filters and labels", () => {
    const liveOperation = {
      needs_attention: false,
      attention_type: "none",
      production_bucket: "production_complete",
      content_bucket: "live",
    };
    const archivedOperation = {
      needs_attention: false,
      attention_type: "none",
      production_bucket: "archived",
      content_bucket: "archived",
    };

    expect(matchesOperationsFilter(liveOperation, "live")).toBe(true);
    expect(matchesOperationsFilter(archivedOperation, "archived")).toBe(true);
    expect(operationsWorkspaceButtonLabel("content_studio")).toBe("Open Content Studio");
    expect(operationsQueueEmptyStateText("production", "production")).toContain(
      "production queue is clear"
    );
    expect(operationsPassiveEmptyStateText("archived")).toContain("read-only reference");
  });

  it("builds passive and queue display state from the active operations filter", () => {
    expect(buildOperationsBoardViewState("archived")).toEqual({
      showPassiveOperationsResults: true,
      showProductionQueue: false,
      showContentQueue: false,
      passiveOperationsTitle: "Archived Dolls",
      passiveOperationsMeta:
        "A read-only reference list for dolls that have been archived out of active operations.",
    });

    expect(buildOperationsBoardViewState("needs_attention")).toEqual({
      showPassiveOperationsResults: false,
      showProductionQueue: true,
      showContentQueue: true,
      passiveOperationsTitle: "Live Dolls",
      passiveOperationsMeta:
        "A read-only reference list for dolls whose content is already live.",
    });
  });
});
