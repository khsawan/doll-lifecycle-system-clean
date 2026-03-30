import { describe, expect, it } from "vitest";
import {
  ASSET_SERVICE_ERROR_CODES,
  isStableAssetServiceErrorCode,
  mapAssetServiceErrorCode,
  normalizeAssetServiceError,
} from "../../../../lib/assets/interface/errors";

describe("asset interface errors", () => {
  it("maps stable asset service error codes from common failure messages", () => {
    expect(mapAssetServiceErrorCode(new Error("A doll id is required."))).toBe(
      ASSET_SERVICE_ERROR_CODES.INVALID_REQUEST
    );
    expect(mapAssetServiceErrorCode(new Error("Generate a QR code first."))).toBe(
      ASSET_SERVICE_ERROR_CODES.QR_GENERATION_FAILED
    );
    expect(mapAssetServiceErrorCode(new Error("Supabase environment variables are missing."))).toBe(
      ASSET_SERVICE_ERROR_CODES.STORAGE_UNAVAILABLE
    );
    expect(mapAssetServiceErrorCode({ code: "QR_UPLOAD_FAILED", message: "Upload failed." })).toBe(
      ASSET_SERVICE_ERROR_CODES.UPLOAD_FAILED
    );
  });

  it("normalizes asset service failures with request ids and trace metadata", () => {
    const result = normalizeAssetServiceError(new Error("Could not update dolls record."), {
      requestId: "asset_req_1",
      trace: {
        executionMode: "in_process",
        operation: "generate_qr",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: ASSET_SERVICE_ERROR_CODES.PERSISTENCE_FAILED,
      message: "Could not update dolls record.",
      retryable: true,
      requestId: "asset_req_1",
      trace: {
        executionMode: "in_process",
        operation: "generate_qr",
      },
    });
  });

  it("recognizes stable asset error codes", () => {
    expect(isStableAssetServiceErrorCode(ASSET_SERVICE_ERROR_CODES.INTERNAL_ERROR)).toBe(true);
    expect(isStableAssetServiceErrorCode("NOT_ASSET")).toBe(false);
  });
});
