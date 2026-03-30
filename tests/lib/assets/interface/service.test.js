import { describe, expect, it, vi } from "vitest";
import { createGenerateQrCommand } from "../../../../lib/shared/contracts";
import { generateQr, uploadImage } from "../../../../lib/assets/interface/service";
import { createUploadImageRequest } from "../../../../lib/assets/interface/requests";
import { ASSET_SERVICE_ERROR_CODES } from "../../../../lib/assets/interface/errors";

describe("asset interface service", () => {
  it("propagates request ids and trace metadata on successful QR command execution", async () => {
    const createAdminStoreClient = vi.fn(() => ({ client: true }));
    const uploadQrAsset = vi.fn(async () => ({
      filePath: "qr-codes/rosie.png",
      publicQrUrl: "https://cdn.example.com/qr-codes/rosie.png",
      storedQrUrl: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
    }));

    const result = await generateQr({
      command: createGenerateQrCommand({
        dollId: "doll-1",
        payload: {
          storageKey: "rosie",
          qrSource: "data:image/png;base64,abc",
          forceRefresh: true,
        },
        metadata: {
          requestId: "req_qr",
          correlationId: "corr_qr",
          requestSource: "admin_qr_route",
          selectedSlug: "rosie",
          publicPath: "/doll/rosie",
        },
      }),
      context: {
        createAdminStoreClient,
        uploadQrAsset,
      },
    });

    expect(result).toMatchObject({
      ok: true,
      requestId: "req_qr",
      data: {
        filePath: "qr-codes/rosie.png",
        publicQrUrl: "https://cdn.example.com/qr-codes/rosie.png",
        storedQrUrl: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
      },
      trace: {
        requestId: "req_qr",
        executionMode: "in_process",
        operation: "generate_qr",
        assetKind: "qr",
        dollId: "doll-1",
        correlationId: "corr_qr",
        requestSource: "admin_qr_route",
        selectedSlug: "rosie",
        publicPath: "/doll/rosie",
      },
    });

    expect(createAdminStoreClient).toHaveBeenCalledTimes(1);
    expect(uploadQrAsset).toHaveBeenCalledWith(
      { client: true },
      {
        dollId: "doll-1",
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: true,
        fetcher: fetch,
        now: Date.now,
      }
    );
  });

  it("supports request-dto execution for image uploads without changing result data", async () => {
    const file = new File(["image"], "rosie.png", { type: "image/png" });
    const createAdminStoreClient = vi.fn(() => ({ client: true }));
    const buildDollImageAssetPath = vi.fn(() => "dolls/7-1234-rosie.png");
    const uploadAssetFile = vi.fn(async () => ({
      filePath: "dolls/7-1234-rosie.png",
      publicUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
    }));
    const updateDollImageUrl = vi.fn(async () => "https://cdn.example.com/dolls/7-1234-rosie.png");

    const result = await uploadImage({
      request: createUploadImageRequest({
        requestId: "req_image",
        dollId: "7",
        file,
        metadata: {
          requestSource: "admin_image_route",
        },
      }),
      context: {
        createAdminStoreClient,
        buildDollImageAssetPath,
        uploadAssetFile,
        updateDollImageUrl,
      },
    });

    expect(result).toMatchObject({
      ok: true,
      requestId: "req_image",
      data: {
        filePath: "dolls/7-1234-rosie.png",
        publicImageUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
      },
      trace: {
        requestId: "req_image",
        executionMode: "in_process",
        operation: "upload_image",
        assetKind: "image",
        dollId: "7",
        requestSource: "admin_image_route",
      },
    });
  });

  it("maps invalid QR command input to a stable asset error code", async () => {
    const result = await generateQr({
      command: { type: "bad" },
    });

    expect(result).toMatchObject({
      ok: false,
      code: ASSET_SERVICE_ERROR_CODES.INVALID_REQUEST,
      message: "Invalid QR generation command.",
    });
  });
});
