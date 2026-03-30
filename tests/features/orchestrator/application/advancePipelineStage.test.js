import { describe, expect, it, vi } from "vitest";
import { createAdvancePipelineStageCommand } from "../../../../lib/shared/contracts";
import { advancePipelineStage } from "../../../../features/orchestrator/application/advancePipelineStage";

describe("application orchestrator pipeline action", () => {
  it("executes a pipeline stage command through the shared application action", async () => {
    const executePipelineCommand = vi.fn(async () => true);
    const command = createAdvancePipelineStageCommand({
      dollId: "doll-1",
      payload: {
        action: "complete",
        stage: "content",
        nextPipelineState: {
          registered: { status: "completed" },
          character: { status: "completed" },
          content: { status: "completed" },
          gateway: { status: "open" },
        },
        successNotice: "Content completed. Gateway is now open.",
      },
    });

    await expect(
      advancePipelineStage({
        command,
        context: {
          executePipelineCommand,
          persistPipelineState: vi.fn(),
          setRecords: vi.fn(),
          syncRecord: vi.fn(),
          setNotice: vi.fn(),
          setError: vi.fn(),
        },
      })
    ).resolves.toMatchObject({
      ok: true,
      code: "PIPELINE_STAGE_ADVANCED",
      data: {
        executed: true,
        command,
      },
    });

    expect(executePipelineCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        command,
        persistPipelineState: expect.any(Function),
        setRecords: expect.any(Function),
        syncRecord: expect.any(Function),
        setNotice: expect.any(Function),
        setError: expect.any(Function),
      })
    );
  });

  it("returns a normalized failure when pipeline execution fails", async () => {
    const executePipelineCommand = vi.fn(async () => false);

    await expect(
      advancePipelineStage({
        command: createAdvancePipelineStageCommand({
          dollId: "doll-1",
          payload: {
            action: "complete",
            nextPipelineState: {
              registered: { status: "completed" },
            },
          },
        }),
        context: {
          executePipelineCommand,
        },
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "PIPELINE_STAGE_ADVANCE_FAILED",
      message: "Could not update pipeline stage.",
    });
  });
});
