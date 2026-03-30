import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "../../../../features/production-pipeline/hooks/useProductionPipelineOrchestrator",
  () => ({
    useProductionPipelineOrchestrator: vi.fn(),
  })
);

import { useAdminPipelineActions } from "../../../../features/admin/hooks/useAdminPipelineActions";
import { useProductionPipelineOrchestrator } from "../../../../features/production-pipeline/hooks/useProductionPipelineOrchestrator";

function HookProbe({ onValue, props }) {
  onValue(useAdminPipelineActions(props));
  return createElement("div", null, "probe");
}

describe("admin pipeline actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adapts the admin workspace pipeline inputs into the shared orchestrator", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        persisted: true,
        pipelineState: {
          registered: { status: "completed" },
        },
      }),
    }));
    const props = {
      selected: { id: "doll-1" },
      selectedPipelineState: {
        registered: { status: "open" },
      },
      selectedReadiness: {
        production: {
          complete: true,
          missing: [],
        },
        overall: true,
      },
      gatewayReadinessState: {
        complete: true,
      },
      setDolls: vi.fn(),
      setError: vi.fn(),
      setNotice: vi.fn(),
      fetcher,
    };

    useProductionPipelineOrchestrator.mockReturnValue({
      completePipelineStage: vi.fn(),
    });

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
        props,
      })
    );

    expect(useProductionPipelineOrchestrator).toHaveBeenCalledWith({
      selected: props.selected,
      pipelineState: props.selectedPipelineState,
      readinessState: props.selectedReadiness,
      gatewayReadinessState: props.gatewayReadinessState,
      setRecords: props.setDolls,
      syncRecord: expect.any(Function),
      persistPipelineState: expect.any(Function),
      setError: props.setError,
      setNotice: props.setNotice,
      resolveStageReadinessState: expect.any(Function),
      buildBlockedMessage: expect.any(Function),
    });

    const orchestratorInput = useProductionPipelineOrchestrator.mock.calls[0][0];
    await expect(
      orchestratorInput.persistPipelineState("doll-1", {
        registered: { status: "completed" },
      })
    ).resolves.toEqual({
      persisted: true,
      pipelineState: {
        registered: { status: "completed" },
      },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/doll-1/pipeline-state", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pipelineState: {
          registered: { status: "completed" },
        },
      }),
    });
    expect(
      orchestratorInput.resolveStageReadinessState(
        "registered",
        props.selectedReadiness,
        props.gatewayReadinessState
      )
    ).toEqual({
      complete: true,
      missing: [],
    });
    expect(result).toEqual({
      completePipelineStage: expect.any(Function),
    });
  });
});
