import { describe, expect, it, vi, afterEach } from "vitest";
import {
  completePipelineStageTransition,
  createDefaultPipelineState,
  getCurrentOpenPipelineStage,
  normalizePipelineState,
  reopenPipelineStageTransition,
} from "../../lib/pipelineState";

afterEach(() => {
  vi.useRealTimers();
});

describe("pipelineState", () => {
  it("creates the expected default workflow sequence", () => {
    const timestamp = "2026-03-28T10:00:00.000Z";
    const state = createDefaultPipelineState(timestamp);

    expect(state.registered).toEqual({
      status: "open",
      updatedAt: timestamp,
      completedAt: null,
      reopenedAt: null,
    });
    expect(state.character.status).toBe("locked");
    expect(state.content.status).toBe("locked");
    expect(state.gateway.status).toBe("locked");
    expect(state.ready.status).toBe("locked");
  });

  it("completes the current stage and opens the next one", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T10:15:00.000Z"));

    const nextState = completePipelineStageTransition(createDefaultPipelineState(), "registered");

    expect(nextState.registered.status).toBe("completed");
    expect(nextState.registered.completedAt).toBe("2026-03-28T10:15:00.000Z");
    expect(nextState.character.status).toBe("open");
    expect(getCurrentOpenPipelineStage(nextState)).toBe("character");
  });

  it("reopens a completed stage and locks downstream work", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T10:20:00.000Z"));
    const completedRegistered = completePipelineStageTransition(
      createDefaultPipelineState(),
      "registered"
    );

    vi.setSystemTime(new Date("2026-03-28T10:25:00.000Z"));
    const reopenedState = reopenPipelineStageTransition(completedRegistered, "registered");

    expect(reopenedState.registered.status).toBe("open");
    expect(reopenedState.registered.reopenedAt).toBe("2026-03-28T10:25:00.000Z");
    expect(reopenedState.character.status).toBe("locked");
    expect(getCurrentOpenPipelineStage(reopenedState)).toBe("registered");
  });

  it("normalizes invalid input back to a safe default state", () => {
    const normalized = normalizePipelineState({
      registered: { status: "done" },
      character: { status: "finished" },
    });

    expect(normalized.registered.status).toBe("open");
    expect(normalized.character.status).toBe("locked");
    expect(normalized.content.status).toBe("locked");
    expect(getCurrentOpenPipelineStage(normalized)).toBe("registered");
  });
});
