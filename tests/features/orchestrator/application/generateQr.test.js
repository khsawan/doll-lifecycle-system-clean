import { describe, expect, it, vi } from "vitest";
import { createGenerateQrCommand } from "../../../../lib/shared/contracts";
import { generateQr } from "../../../../features/orchestrator/application/generateQr";

describe("application orchestrator QR action", () => {
  it("uploads a QR code through the shared QR action", async () => {
    const createAdminStoreClient = vi.fn(() => ({ client: true }));
    const uploadAdminQrCode = vi.fn(async () => ({
      filePath: "qr-codes/rosie.png",
      publicQrUrl: "https://cdn.example.com/qr-codes/rosie.png",
      storedQrUrl: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
    }));

    await expect(
      generateQr({
        command: createGenerateQrCommand({
          dollId: "doll-1",
          payload: {
            storageKey: "rosie",
            qrSource: "data:image/png;base64,abc",
            forceRefresh: true,
          },
        }),
        context: {
          createAdminStoreClient,
          uploadAdminQrCode,
        },
      })
    ).resolves.toMatchObject({
      ok: true,
      code: "QR_GENERATED",
      data: {
        filePath: "qr-codes/rosie.png",
      },
    });

    expect(createAdminStoreClient).toHaveBeenCalledTimes(1);
    expect(uploadAdminQrCode).toHaveBeenCalledWith(
      { client: true },
      expect.objectContaining({
        dollId: "doll-1",
        storageKey: "rosie",
        qrSource: "data:image/png;base64,abc",
        forceRefresh: true,
      })
    );
  });

  it("returns a normalized failure when the QR command is invalid", async () => {
    await expect(
      generateQr({
        command: null,
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "ASSET_INVALID_REQUEST",
      message: "Invalid QR generation command.",
    });
  });
});
