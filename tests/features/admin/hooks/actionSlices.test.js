import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminDangerZone", () => ({
  useAdminDangerZone: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminPipelineActions", () => ({
  useAdminPipelineActions: vi.fn(),
}));

vi.mock("../../../../features/admin/hooks/useAdminQrWorkflow", () => ({
  useAdminQrWorkflow: vi.fn(),
}));

import { useAdminDangerActionController } from "../../../../features/admin/hooks/useAdminDangerActionController";
import { useAdminDangerZone } from "../../../../features/admin/hooks/useAdminDangerZone";
import { useAdminPipelineActionController } from "../../../../features/admin/hooks/useAdminPipelineActionController";
import { useAdminPipelineActions } from "../../../../features/admin/hooks/useAdminPipelineActions";
import { useAdminQrActionController } from "../../../../features/admin/hooks/useAdminQrActionController";
import { useAdminQrWorkflow } from "../../../../features/admin/hooks/useAdminQrWorkflow";

function PipelineHookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminPipelineActionController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function QrHookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminQrActionController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

function DangerHookProbe({ onValue, workspaceControllerState, setError, setNotice }) {
  onValue(
    useAdminDangerActionController({
      workspaceControllerState,
      setError,
      setNotice,
    })
  );

  return createElement("div", null, "probe");
}

describe("admin action slices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the pipeline action controller and exposes a clear-warning helper", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        setDolls: vi.fn(),
      },
      workspaceViewState: {
        selectedPipelineState: { registered: { status: "completed" } },
        selectedReadiness: { overall: true },
        gatewayReadinessState: { complete: true },
      },
    };
    const pipelineActionsState = {
      setStageActionWarning: vi.fn(),
    };
    useAdminPipelineActions.mockReturnValue(pipelineActionsState);

    let result;
    renderToStaticMarkup(
      createElement(PipelineHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminPipelineActions).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      selectedPipelineState:
        workspaceControllerState.workspaceViewState.selectedPipelineState,
      selectedReadiness: workspaceControllerState.workspaceViewState.selectedReadiness,
      gatewayReadinessState:
        workspaceControllerState.workspaceViewState.gatewayReadinessState,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setError,
      setNotice,
    });
    result.clearStageActionWarning();
    expect(pipelineActionsState.setStageActionWarning).toHaveBeenCalledWith(null);
  });

  it("wires the QR action controller and surfaces the print-card ref", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1", internal_id: "DOLL-001" },
        setDolls: vi.fn(),
      },
      detailState: {
        qrDataUrl: "data:image/png;base64,abc",
        setQrDataUrl: vi.fn(),
      },
      publicLinkState: {
        slugLocked: false,
        selectedSlug: "rosie",
        publicUrl: "https://example.com/doll/rosie",
      },
      workspaceViewState: {
        qrReady: true,
        qrReadinessMessage: "Ready",
        savedQrUrl: "https://example.com/qr.png",
        qrIsSensitive: false,
      },
    };
    const qrWorkflowState = {
      setQrUploading: vi.fn(),
      setShowQrRegenerateWarning: vi.fn(),
    };
    useAdminQrWorkflow.mockReturnValue(qrWorkflowState);

    let result;
    renderToStaticMarkup(
      createElement(QrHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminQrWorkflow).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      slugLocked: false,
      selectedSlug: "rosie",
      publicUrl: "https://example.com/doll/rosie",
      qrReady: true,
      qrReadinessMessage: "Ready",
      qrDataUrl: workspaceControllerState.detailState.qrDataUrl,
      setQrDataUrl: workspaceControllerState.detailState.setQrDataUrl,
      savedQrUrl: "https://example.com/qr.png",
      qrIsSensitive: false,
      printCardRef: expect.any(Object),
      setDolls: workspaceControllerState.catalogState.setDolls,
      setError,
      setNotice,
    });
    expect(result.qrWorkflowState.printCardRef).toBe(
      useAdminQrWorkflow.mock.calls[0][0].printCardRef
    );
  });

  it("wires the danger action controller", () => {
    const setError = vi.fn();
    const setNotice = vi.fn();
    const workspaceControllerState = {
      catalogState: {
        selected: { id: "doll-1" },
        dolls: [{ id: "doll-1" }],
        setDolls: vi.fn(),
        setSelectedId: vi.fn(),
      },
      detailState: {
        setQrDataUrl: vi.fn(),
        setStory: vi.fn(),
        setContentPack: vi.fn(),
        setOrder: vi.fn(),
      },
      workspaceViewState: {
        dangerNeedsArchiveWarning: false,
        dangerNeedsTypedDelete: true,
      },
    };
    const dangerZoneState = {
      requestPermanentDelete: vi.fn(),
    };
    useAdminDangerZone.mockReturnValue(dangerZoneState);

    let result;
    renderToStaticMarkup(
      createElement(DangerHookProbe, {
        onValue: (value) => {
          result = value;
        },
        workspaceControllerState,
        setError,
        setNotice,
      })
    );

    expect(useAdminDangerZone).toHaveBeenCalledWith({
      selected: workspaceControllerState.catalogState.selected,
      dolls: workspaceControllerState.catalogState.dolls,
      dangerNeedsArchiveWarning: false,
      dangerNeedsTypedDelete: true,
      setDolls: workspaceControllerState.catalogState.setDolls,
      setSelectedId: workspaceControllerState.catalogState.setSelectedId,
      setQrDataUrl: workspaceControllerState.detailState.setQrDataUrl,
      setStory: workspaceControllerState.detailState.setStory,
      setContentPack: workspaceControllerState.detailState.setContentPack,
      setOrder: workspaceControllerState.detailState.setOrder,
      setError,
      setNotice,
    });
    expect(result).toEqual({
      dangerZoneState,
    });
  });
});
