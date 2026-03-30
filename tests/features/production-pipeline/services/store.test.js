import { describe, expect, it, vi } from "vitest";
import { saveProductionPipelineState } from "../../../../features/production-pipeline/services/store";

describe("production pipeline store service", () => {
  it("delegates pipeline persistence through the injected storage adapter", async () => {
    const persistPipelineState = vi.fn(async () => ({
      persisted: true,
      pipelineState: {
        registered: { status: "completed" },
      },
    }));

    await expect(
      saveProductionPipelineState(
        { store: true },
        "doll-1",
        {
          registered: { status: "completed" },
        },
        { persistPipelineState }
      )
    ).resolves.toEqual({
      persisted: true,
      pipelineState: {
        registered: { status: "completed" },
      },
    });

    expect(persistPipelineState).toHaveBeenCalledWith(
      { store: true },
      "doll-1",
      {
        registered: { status: "completed" },
      }
    );
  });
});
