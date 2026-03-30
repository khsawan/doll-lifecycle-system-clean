import { describe, expect, it } from "vitest";
import {
  buildContentAssetCompleteness,
  buildContentManagementViewState,
  buildDashboardWorkspaceState,
  buildOperationsBoardState,
  buildSelectedReadinessState,
  buildSelectedWorkspaceViewState,
  buildWorkflowViewState,
} from "../../../../features/admin/domain/workspaceView";

describe("admin workspace view helpers", () => {
  it("builds workflow guidance and next steps from readiness state", () => {
    const state = buildWorkflowViewState({
      selectedReadiness: {
        production: { complete: false, missing: ["image_url"] },
        character: { complete: true, missing: [] },
        content: { complete: true, missing: [] },
        digital: { complete: false, missing: ["qr_code_url"] },
        commercial: { complete: false, missing: ["commerce_status"] },
        overall: false,
      },
      qrReady: true,
      currentStageView: "registered",
      currentStageViewStatus: "open",
    });

    expect(state.readinessOverviewItems).toHaveLength(5);
    expect(state.overviewBlockingItems.map((item) => item.key)).toEqual([
      "production",
      "digital",
    ]);
    expect(state.globalWorkspaceNextStepMessage).toBe(
      "Next step: add the doll image in Production."
    );
    expect(state.activeStageNextStepMessage).toBe("Add a doll image to complete production.");
    expect(state.workflowGuidance).toEqual({
      tone: "muted",
      message: "Add a doll image to complete production.",
    });
  });

  it("builds content-management summaries from status and asset completeness", () => {
    const contentAssetCompleteness = buildContentAssetCompleteness({
      identityImageUrl: "https://example.com/rosie.png",
      selectedImageUrl: "",
      qrDataUrl: "",
      selectedQrCodeUrl: "https://example.com/qr.png",
      story: {
        teaser: "",
        mainStory: "A gentle little story",
        mini1: "",
        mini2: "",
      },
      selectedStoryMain: "",
      selectedStory: "",
    });
    const state = buildContentManagementViewState({
      selectedContentManagement: {
        generation_status: "generated",
        review_status: "draft",
        publish_status: "hidden",
      },
      contentAssetCompleteness,
    });

    expect(contentAssetCompleteness.percent).toBe(100);
    expect(state.contentManagementNextStepGuidance).toBe(
      "Next step: Review and approve the generated content"
    );
    expect(state.contentManagementStateSummary).toBe("Generated / Draft / Hidden");
    expect(state.contentOverviewItems[0]).toMatchObject({
      key: "generation_status",
      value: "Generated",
      tone: "success",
    });
  });

  it("builds dashboard workspace labels and summaries from pipeline and content state", () => {
    const state = buildDashboardWorkspaceState({
      selectedReadiness: {
        overall: true,
      },
      contentManagementNextStepGuidance: "Next step: Publish the doll to make it live",
      globalWorkspaceNextStepMessage: "All pipeline stages are complete.",
      currentSelectedWorkspaceMode: "content_studio",
      currentWorkflowStageLabel: "Ready",
      dollIdentityWorkflowState: "Completed",
      selectedContentManagement: {
        generation_status: "generated",
        review_status: "approved",
        publish_status: "hidden",
      },
      contentManagementStateSummary: "Generated / Approved / Hidden",
      contentAssetCompleteness: {
        percent: 67,
        completeCount: 2,
        total: 3,
      },
    });

    expect(state.dashboardRecommendedWorkspace).toBe("content_studio");
    expect(state.dashboardRecommendedWorkspaceLabel).toBe("Open Content Studio");
    expect(state.dashboardNextStepMessage).toBe(
      "Next step: Publish the doll to make it live"
    );
    expect(state.selectedWorkspaceHeading).toBe("Content Studio");
    expect(state.selectedWorkspaceSummary).toBe(
      "Content status: Generated / Approved / Hidden"
    );
  });

  it("builds selected-doll readiness state from route editor data", () => {
    const state = buildSelectedReadinessState({
      selected: {
        internal_id: "DOLL-001",
        image_url: "",
        universe_id: null,
        theme_name: "Unassigned",
        story: "",
        story_main: "",
        qr_code_url: "",
      },
      identity: {
        name: "Rosie",
        theme_name: "Nature Friends",
        personality_traits: "gentle",
        emotional_hook: "",
        expression_feel: "soft smile",
        character_world: "Woodland",
        social_hook: "",
        social_caption: "",
        social_cta: "",
        color_palette: "",
        notable_features: "",
      },
      story: {
        mainStory: "",
      },
      contentPack: {
        caption: "",
        hook: "",
        blurb: "",
        cta: "",
      },
      selectedSlug: "",
      publicPath: "",
      publicUrl: "",
      effectiveCommerceStatus: "draft",
    });

    expect(state.production).toEqual({
      complete: false,
      missing: ["image_url", "color_palette", "notable_features"],
    });
    expect(state.character.complete).toBe(false);
    expect(state.character.missing).toContain("emotional_hook");
    expect(state.content.missing).toEqual([
      "story_content",
      "content_pack",
      "social_content",
    ]);
    expect(state.digital.missing).toEqual(["slug", "public_link", "qr_code_url"]);
    expect(state.commercial.missing).toEqual(["commerce_status"]);
    expect(state.overall).toBe(false);
  });

  it("builds selected workspace view state from route-level editor and workflow inputs", () => {
    const state = buildSelectedWorkspaceViewState({
      selected: {
        id: 7,
        internal_id: "DOLL-007",
        name: "Rosie",
        artist_name: "",
        theme_name: "Nature Friends",
        character_world: "Woodland",
        commerce_status: "draft",
        sales_status: "reserved",
        availability_status: "",
        qr_code_url: "https://example.com/qr.png",
        image_url: "https://example.com/rosie.png",
        story_main: "Saved story",
        slug: "rosie",
        status: "digital",
        pipeline_state: {
          registered: { status: "completed" },
          character: { status: "completed" },
          content: { status: "completed" },
          gateway: { status: "open" },
          ready: { status: "locked" },
        },
        created_at: "2026-03-28T10:00:00.000Z",
      },
      identity: {
        image_url: "https://example.com/rosie.png",
        name: "Rosie",
        character_world: "Woodland",
        theme_name: "Nature Friends",
        personality_traits: "gentle",
        emotional_hook: "Rosie comforts little friends",
        expression_feel: "soft smile",
        social_hook: "Meet Rosie",
        social_caption: "Rosie brings calm",
        social_cta: "Adopt Rosie",
        color_palette: "cream, rose",
        notable_features: "hand-sewn dress",
      },
      story: {
        teaser: "Hello",
        mainStory: "Story",
        mini1: "Mini 1",
        mini2: "Mini 2",
      },
      contentPack: {
        caption: "Caption",
        hook: "Hook",
        blurb: "Blurb",
        cta: "CTA",
      },
      order: {
        customer_name: "Layla",
        contact_info: "layla@example.com",
        order_status: "reserved",
      },
      qrDataUrl: "data:image/png;base64,abc",
      dolls: [],
      contentManagementByDoll: {},
      selectedContentManagement: {
        generation_status: "generated",
        review_status: "approved",
        publish_status: "hidden",
      },
      selectedGeneratedV1Content: {
        play_activity: {
          prompt: "Choose a path",
          choices: [
            { label: "Climb", result_text: "Up we go" },
          ],
        },
      },
      activeDepartment: "Digital",
      activeStageView: "gateway",
      selectedWorkspaceMode: "pipeline",
      operationsFilter: "all",
      operationsSort: "urgency",
      selectedSlug: "rosie",
      publicPath: "/doll/rosie",
      publicUrl: "https://example.com/doll/rosie",
      savedSlug: "rosie",
      legacyLockedSlug: "",
      error: "",
      notice: "",
    });

    expect(state.currentWorkflowStageLabel).toBe("Gateway");
    expect(state.dollIdentityCollection).toBe("Nature Friends");
    expect(state.dollIdentityArtistDisplay).toBe("Unassigned");
    expect(state.qrIsSensitive).toBe(true);
    expect(state.dangerNeedsTypedDelete).toBe(false);
    expect(state.contentPreviewHref).toBe("https://example.com/doll/rosie");
    expect(state.qrStatus).toBe("generated");
    expect(state.qrReady).toBe(true);
    expect(state.selectedReadiness.digital.complete).toBe(true);
    expect(state.workflowGuidance).toEqual({
      tone: "muted",
      message: "Set Product Commerce Status to Ready for Sale.",
    });
    expect(state.selectedHasPlayActivityChoices).toBe(true);
    expect(state.dashboardRecommendedWorkspace).toBe("pipeline");
    expect(state.isContentEditable).toBe(false);
  });

  it("keeps content studio editable after the content stage has already been completed", () => {
    const state = buildSelectedWorkspaceViewState({
      selected: {
        id: 7,
        internal_id: "DOLL-007",
        name: "Rosie",
        theme_name: "Nature Friends",
        character_world: "Woodland",
        commerce_status: "draft",
        sales_status: "reserved",
        availability_status: "",
        qr_code_url: "https://example.com/qr.png",
        image_url: "https://example.com/rosie.png",
        story_main: "Saved story",
        slug: "rosie",
        status: "digital",
        pipeline_state: {
          registered: { status: "completed" },
          character: { status: "completed" },
          content: { status: "completed" },
          gateway: { status: "open" },
          ready: { status: "locked" },
        },
        created_at: "2026-03-28T10:00:00.000Z",
      },
      identity: {
        image_url: "https://example.com/rosie.png",
        name: "Rosie",
        character_world: "Woodland",
        theme_name: "Nature Friends",
        personality_traits: "gentle",
        emotional_hook: "Rosie comforts little friends",
        expression_feel: "soft smile",
        social_hook: "Meet Rosie",
        social_caption: "Rosie brings calm",
        social_cta: "Adopt Rosie",
        color_palette: "cream, rose",
        notable_features: "hand-sewn dress",
      },
      story: {
        teaser: "Hello",
        mainStory: "Story",
        mini1: "Mini 1",
        mini2: "Mini 2",
      },
      contentPack: {
        caption: "Caption",
        hook: "Hook",
        blurb: "Blurb",
        cta: "CTA",
      },
      order: {
        customer_name: "Layla",
        contact_info: "layla@example.com",
        order_status: "reserved",
      },
      qrDataUrl: "data:image/png;base64,abc",
      dolls: [],
      contentManagementByDoll: {},
      selectedContentManagement: {
        generation_status: "generated",
        review_status: "approved",
        publish_status: "hidden",
      },
      selectedGeneratedV1Content: {
        play_activity: {
          prompt: "Choose a path",
          choices: [{ label: "Climb", result_text: "Up we go" }],
        },
      },
      activeDepartment: "Digital",
      activeStageView: "gateway",
      selectedWorkspaceMode: "content_studio",
      operationsFilter: "all",
      operationsSort: "urgency",
      selectedSlug: "rosie",
      publicPath: "/doll/rosie",
      publicUrl: "https://example.com/doll/rosie",
      savedSlug: "rosie",
      legacyLockedSlug: "",
      error: "",
      notice: "",
    });

    expect(state.currentWorkflowStageLabel).toBe("Gateway");
    expect(state.currentSelectedWorkspaceMode).toBe("content_studio");
    expect(state.isContentEditable).toBe(true);
  });

  it("builds filtered operations board queues and summary metrics", () => {
    const state = buildOperationsBoardState({
      dolls: [
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
            content: { status: "completed" },
            gateway: { status: "completed" },
            ready: { status: "completed" },
          },
        },
      ],
      contentManagementByDoll: {
        1: {
          generation_status: "generated",
          review_status: "approved",
          publish_status: "hidden",
        },
        2: {
          generation_status: "generated",
          review_status: "approved",
          publish_status: "live",
        },
      },
      operationsFilter: "all",
      operationsSort: "urgency",
    });

    expect(state.operationsByDoll).toHaveLength(2);
    expect(state.operationsSummaryItems).toEqual([
      { key: "total", label: "Total Dolls", value: 2 },
      { key: "production_attention", label: "Production Attention", value: 1 },
      { key: "content_attention", label: "Content Attention", value: 0 },
      { key: "ready_to_publish", label: "Ready to Publish", value: 1 },
      { key: "live", label: "Live", value: 1 },
    ]);
    expect(state.filteredOperationsByDoll.map((item) => item.internal_id)).toEqual([
      "DOLL-001",
      "DOLL-002",
    ]);
    expect(state.productionQueueGroups[0]).toMatchObject({
      bucket: "blocked_in_gateway",
    });
  });
});
