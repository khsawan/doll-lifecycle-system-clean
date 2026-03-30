import { describe, expect, it } from "vitest";
import {
  createAssetServiceRequest,
  createAssetServiceRequestFromCommand,
  createGenerateQrRequest,
  createUploadImageRequest,
  isAssetServiceRequest,
} from "../../../../lib/assets/interface/requests";
import { createGenerateQrCommand } from "../../../../lib/shared/contracts";

describe("asset interface requests", () => {
  it("creates transport-safe QR service requests with generated request ids", () => {
    const request = createGenerateQrRequest({
      dollId: "doll-1",
      payload: {
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: true,
      },
      metadata: {
        requestSource: "admin_qr_route",
        selectedSlug: "rosie",
        unsafe: () => "skip",
      },
    });

    expect(request.requestId).toMatch(/^asset_/);
    expect(request).toMatchObject({
      operation: "generate_qr",
      dollId: "doll-1",
      payload: {
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: true,
      },
      metadata: {
        requestSource: "admin_qr_route",
        selectedSlug: "rosie",
      },
    });
    expect(isAssetServiceRequest(request)).toBe(true);
  });

  it("creates upload-image requests without stripping the file payload", () => {
    const file = new File(["image"], "rosie.png", { type: "image/png" });
    const request = createUploadImageRequest({
      requestId: "asset_upload",
      entityId: "doll-2",
      file,
      metadata: {
        requestSource: "admin_image_route",
      },
    });

    expect(request).toMatchObject({
      requestId: "asset_upload",
      operation: "upload_image",
      entityId: "doll-2",
      metadata: {
        requestSource: "admin_image_route",
      },
    });
    expect(request.payload.file).toBe(file);
    expect(isAssetServiceRequest(request)).toBe(true);
  });

  it("can derive a QR service request from an internal command envelope", () => {
    const request = createAssetServiceRequestFromCommand(
      createGenerateQrCommand({
        dollId: "doll-1",
        payload: {
          storageKey: "rosie",
          qrSource: "data:image/png;base64,abc",
        },
        metadata: {
          requestId: "req_qr",
          correlationId: "corr_qr",
        },
      }),
      "generate_qr"
    );

    expect(request).toEqual({
      requestId: "req_qr",
      operation: "generate_qr",
      dollId: "doll-1",
      payload: {
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: false,
      },
      metadata: {
        requestId: "req_qr",
        correlationId: "corr_qr",
      },
    });
  });

  it("rejects malformed asset service requests", () => {
    expect(
      isAssetServiceRequest(
        createAssetServiceRequest({
          operation: "generate_qr",
          payload: {},
        })
      )
    ).toBe(true);
    expect(isAssetServiceRequest({ requestId: "", operation: "generate_qr", payload: {} })).toBe(
      false
    );
  });
});
