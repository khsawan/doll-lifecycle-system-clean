import { describe, expect, it, vi } from "vitest";
import { executePipelineCommand } from "../../../../features/production-pipeline/services/commandExecutor";

describe("production pipeline command executor", () => {
  it("persists a command, syncs records, and publishes the success notice", async () => {
    const persistPipelineState = vi.fn(async () => ({
      persisted: false,
      pipelineState: {
        registered: { status: "completed" },
      },
    }));
    const syncRecord = vi.fn((record, pipelineState, options) => ({
      ...record,
      pipelineState,
      persisted: options.persisted,
    }));
    const setRecords = vi.fn((updater) =>
      updater([
        { id: "doll-1", name: "Rosie" },
        { id: "doll-2", name: "Luna" },
      ])
    );
    const setNotice = vi.fn();
    const setError = vi.fn();

    await expect(
      executePipelineCommand({
        command: {
          dollId: "doll-2",
          payload: {
            nextPipelineState: {
              registered: { status: "completed" },
            },
            successNotice: "Character completed.",
          },
        },
        persistPipelineState,
        setRecords,
        syncRecord,
        setNotice,
        setError,
      })
    ).resolves.toBe(true);

    expect(persistPipelineState).toHaveBeenCalledWith("doll-2", {
      registered: { status: "completed" },
    });
    expect(syncRecord).toHaveBeenCalled();
    expect(setNotice).toHaveBeenCalledWith("Character completed.");
    expect(setError).not.toHaveBeenCalled();
  });

  it("publishes the persistence error when command execution fails", async () => {
    const setError = vi.fn();

    await expect(
      executePipelineCommand({
        command: {
          dollId: "doll-2",
          payload: {
            nextPipelineState: {
              registered: { status: "open" },
            },
            successNotice: "Should not be used",
          },
        },
        persistPipelineState: vi.fn(async () => {
          throw new Error("boom");
        }),
        setRecords: vi.fn(),
        syncRecord: vi.fn(),
        setNotice: vi.fn(),
        setError,
      })
    ).resolves.toBe(false);

    expect(setError).toHaveBeenCalledWith("boom");
  });
});
