import { describe, expect, it, vi } from "vitest";
import { applyPipelineCommandToRecords } from "../../../../features/production-pipeline/services/recordSync";

describe("production pipeline record sync", () => {
  it("updates only the targeted record through the injected sync adapter", () => {
    const syncRecord = vi.fn((record, pipelineState, options) => ({
      ...record,
      pipelineState,
      persisted: options.persisted,
    }));

    const result = applyPipelineCommandToRecords(
      [
        { id: "doll-1", name: "Rosie" },
        { id: "doll-2", name: "Luna" },
      ],
      {
        dollId: "doll-2",
        pipelineState: {
          registered: { status: "completed" },
        },
        persisted: false,
        syncRecord,
      }
    );

    expect(syncRecord).toHaveBeenCalledWith(
      { id: "doll-2", name: "Luna" },
      {
        registered: { status: "completed" },
      },
      {
        persisted: false,
      }
    );
    expect(result).toEqual([
      { id: "doll-1", name: "Rosie" },
      {
        id: "doll-2",
        name: "Luna",
        pipelineState: {
          registered: { status: "completed" },
        },
        persisted: false,
      },
    ]);
  });
});
