import { describe, expect, it, vi } from "vitest";
import {
  buildPipelineStageCompletionNotice,
  buildPipelineStageReopenNotice,
  createPipelineCompletionCommand,
  createPipelineReopenCommand,
  createPipelineReopenWarning,
} from "../../../../features/production-pipeline/domain/commands";

describe("production pipeline commands", () => {
  it("builds completion and reopen notices from pipeline stages", () => {
    expect(buildPipelineStageCompletionNotice("registered", "character")).toBe(
      "Registered completed. Character is now open."
    );
    expect(buildPipelineStageReopenNotice("content", "gateway")).toBe(
      "Content reopened. Later stages were locked."
    );
  });

  it("creates a completion command when the selected stage is open and ready", () => {
    const resolveStageReadinessState = vi.fn(() => ({
      complete: true,
      missing: [],
    }));

    const result = createPipelineCompletionCommand({
      selected: {
        id: "doll-1",
      },
      pipelineState: {
        registered: { status: "completed" },
        character: { status: "open" },
        content: { status: "locked" },
        gateway: { status: "locked" },
        ready: { status: "locked" },
      },
      stage: "character",
      readinessState: {
        overall: true,
      },
      gatewayReadinessState: {
        complete: true,
      },
      resolveStageReadinessState,
      buildBlockedMessage: vi.fn(),
    });

    expect(resolveStageReadinessState).toHaveBeenCalledWith(
      "character",
      {
        overall: true,
      },
      {
        complete: true,
      }
    );
    expect(result).toMatchObject({
      ok: true,
      code: "PIPELINE_STAGE_ADVANCE_READY",
      data: {
        command: {
          type: "AdvancePipelineStage",
          dollId: "doll-1",
          payload: {
            action: "complete",
            stage: "character",
            nextStage: "content",
            successNotice: "Character completed. Content is now open.",
          },
        },
      },
    });
    expect(result.data.command.payload.nextPipelineState.character.status).toBe("completed");
    expect(result.data.command.payload.nextPipelineState.content.status).toBe("open");
  });

  it("blocks completion when the requested stage is not the current open stage", () => {
    const result = createPipelineCompletionCommand({
      selected: {
        id: "doll-1",
      },
      pipelineState: {
        registered: { status: "open" },
        character: { status: "locked" },
        content: { status: "locked" },
        gateway: { status: "locked" },
        ready: { status: "locked" },
      },
      stage: "character",
      resolveStageReadinessState: vi.fn(),
      buildBlockedMessage: vi.fn(),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "PIPELINE_STAGE_NOT_OPEN",
      message: "Only the current open stage can be completed.",
    });
  });

  it("blocks completion with the injected readiness message when readiness is missing", () => {
    const buildBlockedMessage = vi.fn(() => "Blocked by readiness");

    const result = createPipelineCompletionCommand({
      selected: {
        id: "doll-1",
      },
      pipelineState: {
        registered: { status: "completed" },
        character: { status: "open" },
        content: { status: "locked" },
        gateway: { status: "locked" },
        ready: { status: "locked" },
      },
      stage: "character",
      readinessState: {
        overall: false,
      },
      gatewayReadinessState: {
        complete: false,
      },
      resolveStageReadinessState: vi.fn(() => ({
        complete: false,
        missing: ["story_content"],
      })),
      buildBlockedMessage,
    });

    expect(buildBlockedMessage).toHaveBeenCalledWith("character", {
      complete: false,
      missing: ["story_content"],
    });
    expect(result).toMatchObject({
      ok: false,
      code: "PIPELINE_STAGE_BLOCKED",
      message: "Blocked by readiness",
    });
  });

  it("creates reopen commands and downstream warnings for completed stages", () => {
    const pipelineState = {
      registered: { status: "completed" },
      character: { status: "completed" },
      content: { status: "completed" },
      gateway: { status: "open" },
      ready: { status: "locked" },
    };

    const reopenResult = createPipelineReopenCommand({
      selected: {
        id: "doll-1",
      },
      pipelineState,
      stage: "character",
    });
    const warning = createPipelineReopenWarning({
      selected: {
        id: "doll-1",
      },
      pipelineState,
      stage: "character",
      isBusy: false,
    });

    expect(reopenResult).toMatchObject({
      ok: true,
      code: "PIPELINE_STAGE_ADVANCE_READY",
      data: {
        command: {
          type: "AdvancePipelineStage",
          dollId: "doll-1",
          payload: {
            action: "reopen",
            stage: "character",
            downstreamStage: "content",
            successNotice: "Character reopened. Later stages were locked.",
          },
        },
      },
    });
    expect(reopenResult.data.command.payload.nextPipelineState.character.status).toBe("open");
    expect(reopenResult.data.command.payload.nextPipelineState.content.status).toBe("locked");
    expect(warning).toEqual({
      type: "reopen",
      stage: "character",
      affectedStages: ["content", "gateway"],
    });
  });
});
