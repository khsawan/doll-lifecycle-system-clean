import { describe, expect, it } from "vitest";
import {
  normalizeErrorResult,
  readFailureResultMessage,
} from "../../../../lib/shared/contracts/errors";

describe("shared contract errors", () => {
  it("normalizes thrown errors into failure results", () => {
    const failure = normalizeErrorResult(new Error("boom"), {
      code: "PIPELINE_COMMAND_EXECUTION_FAILED",
      message: "Could not update pipeline stage.",
      retryable: true,
    });

    expect(failure).toEqual({
      ok: false,
      code: "PIPELINE_COMMAND_EXECUTION_FAILED",
      message: "boom",
      retryable: true,
    });
  });

  it("reads message text from legacy and contract-shaped failures", () => {
    expect(
      readFailureResultMessage(
        {
          ok: false,
          code: "ASSET_UPLOAD_FAILED",
          message: "Could not upload image.",
          retryable: false,
        },
        "fallback"
      )
    ).toBe("Could not upload image.");

    expect(
      readFailureResultMessage(
        {
          error: "Legacy error message",
        },
        "fallback"
      )
    ).toBe("Legacy error message");
  });
});
