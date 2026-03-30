import { describe, expect, it, vi } from "vitest";
import { saveAdminPipelineStateViaApi } from "../../../../features/admin/services/pipelineApi";

describe("admin pipeline API service", () => {
  it("continues to support the legacy flat pipeline success payload", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        persisted: true,
        pipelineState: {
          registered: { status: "open" },
        },
      }),
    }));

    await expect(
      saveAdminPipelineStateViaApi(fetcher, 5, {
        registered: { status: "open" },
      })
    ).resolves.toEqual({
      persisted: true,
      pipelineState: {
        registered: { status: "open" },
      },
    });
  });

  it("saves pipeline state through the protected pipeline endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        code: "PIPELINE_STATE_SAVED",
        message: "Pipeline state saved.",
        data: {
          persisted: false,
          pipelineState: {
            registered: { status: "completed" },
          },
        },
      }),
    }));

    await expect(
      saveAdminPipelineStateViaApi(fetcher, 5, {
        registered: { status: "completed" },
      })
    ).resolves.toEqual({
      persisted: false,
      pipelineState: {
        registered: { status: "completed" },
      },
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/5/pipeline-state", {
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
  });

  it("surfaces API errors for protected pipeline saves", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        code: "PIPELINE_STATE_SAVE_FAILED",
        message: "boom",
        retryable: true,
      }),
    }));

    await expect(
      saveAdminPipelineStateViaApi(fetcher, 7, {
        registered: { status: "open" },
      })
    ).rejects.toThrow("boom");
  });
});
