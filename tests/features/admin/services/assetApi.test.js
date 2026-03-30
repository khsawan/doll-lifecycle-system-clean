import { describe, expect, it, vi } from "vitest";
import {
  uploadAdminDollImageViaApi,
  uploadAdminQrCodeViaApi,
} from "../../../../features/admin/services/assetApi";

describe("admin asset API service", () => {
  it("uploads an image through the protected doll image endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        filePath: "dolls/7-1234-rosie.png",
        publicImageUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
      }),
    }));
    const file = new File(["image"], "rosie.png", { type: "image/png" });

    await expect(uploadAdminDollImageViaApi(fetcher, 7, file)).resolves.toEqual({
      filePath: "dolls/7-1234-rosie.png",
      publicImageUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/7/image", {
      method: "POST",
      credentials: "same-origin",
      body: expect.any(FormData),
    });
  });

  it("surfaces API errors for protected image uploads", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "boom",
      }),
    }));
    const file = new File(["image"], "rosie.png", { type: "image/png" });

    await expect(uploadAdminDollImageViaApi(fetcher, 7, file)).rejects.toThrow("boom");
  });

  it("reads wrapped protected image upload responses without changing the caller shape", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        code: "IMAGE_UPLOADED",
        message: "Image uploaded.",
        data: {
          filePath: "dolls/7-1234-rosie.png",
          publicImageUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
        },
      }),
    }));
    const file = new File(["image"], "rosie.png", { type: "image/png" });

    await expect(uploadAdminDollImageViaApi(fetcher, 7, file)).resolves.toEqual({
      filePath: "dolls/7-1234-rosie.png",
      publicImageUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
    });
  });

  it("uploads a QR code through the protected doll qr endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        code: "QR_GENERATED",
        message: "QR code uploaded.",
        data: {
          filePath: "qr-codes/rosie.png",
          publicQrUrl: "https://cdn.example.com/qr-codes/rosie.png",
          storedQrUrl: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
        },
      }),
    }));

    await expect(
      uploadAdminQrCodeViaApi(fetcher, 12, {
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: true,
      })
    ).resolves.toEqual({
      filePath: "qr-codes/rosie.png",
      publicQrUrl: "https://cdn.example.com/qr-codes/rosie.png",
      storedQrUrl: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
    });
    expect(fetcher).toHaveBeenCalledWith("/api/admin/dolls/12/qr", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: true,
      }),
    });
  });

  it("surfaces API errors for protected QR uploads", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        code: "QR_UPLOAD_FAILED",
        message: "boom",
        retryable: true,
      }),
    }));

    await expect(
      uploadAdminQrCodeViaApi(fetcher, 12, {
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
      })
    ).rejects.toThrow("boom");
  });
});
