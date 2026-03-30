import { describe, expect, it } from "vitest";
import {
  INTERNAL_COMMAND_TYPES,
  createAdvancePipelineStageCommand,
  createGenerateQrCommand,
  createGenerateStoryCommand,
  isInternalCommandEnvelope,
} from "../../../../lib/shared/contracts/commands";

describe("shared contract commands", () => {
  it("builds generation commands with normalized envelopes", () => {
    const command = createGenerateStoryCommand({
      entityId: "rosie",
      payload: {
        name: "Rosie",
      },
      metadata: {
        provider: "anthropic",
      },
    });

    expect(command).toEqual({
      type: INTERNAL_COMMAND_TYPES.GENERATE_STORY,
      entityId: "rosie",
      payload: {
        name: "Rosie",
      },
      metadata: {
        provider: "anthropic",
      },
    });
    expect(isInternalCommandEnvelope(command)).toBe(true);
  });

  it("builds QR and pipeline-stage commands for future service extraction", () => {
    const qrCommand = createGenerateQrCommand({
      dollId: 7,
      payload: {
        storageKey: "rosie",
        forceRefresh: true,
      },
    });
    const pipelineCommand = createAdvancePipelineStageCommand({
      dollId: "doll-7",
      payload: {
        action: "COMPLETE",
        stage: "character",
        nextStage: "content",
      },
    });

    expect(qrCommand).toEqual({
      type: INTERNAL_COMMAND_TYPES.GENERATE_QR,
      dollId: 7,
      payload: {
        storageKey: "rosie",
        forceRefresh: true,
      },
    });
    expect(pipelineCommand).toEqual({
      type: INTERNAL_COMMAND_TYPES.ADVANCE_PIPELINE_STAGE,
      dollId: "doll-7",
      payload: {
        action: "complete",
        stage: "character",
        nextStage: "content",
      },
    });
  });

  it("rejects invalid pipeline stage actions", () => {
    expect(() =>
      createAdvancePipelineStageCommand({
        dollId: "doll-7",
        payload: {
          action: "archive",
        },
      })
    ).toThrow("Invalid pipeline stage action.");
  });
});
