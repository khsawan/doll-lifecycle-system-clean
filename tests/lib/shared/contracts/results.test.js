import { describe, expect, it } from "vitest";
import {
  createFailureResult,
  createSuccessResult,
  isFailureResult,
  isSuccessResult,
  readSuccessResultData,
} from "../../../../lib/shared/contracts/results";

describe("shared contract results", () => {
  it("builds normalized success results", () => {
    const result = createSuccessResult({
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "story",
      },
      warnings: ["  provider fallback used  ", "", null],
    });

    expect(result).toEqual({
      ok: true,
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "story",
      },
      warnings: ["provider fallback used"],
    });
    expect(isSuccessResult(result)).toBe(true);
    expect(readSuccessResultData(result)).toEqual({
      task: "story",
    });
  });

  it("builds normalized failure results", () => {
    const result = createFailureResult({
      code: "PIPELINE_STAGE_BLOCKED",
      message: "Stage is blocked.",
      retryable: false,
      details: {
        stage: "character",
      },
    });

    expect(result).toEqual({
      ok: false,
      code: "PIPELINE_STAGE_BLOCKED",
      message: "Stage is blocked.",
      retryable: false,
      details: {
        stage: "character",
      },
    });
    expect(isFailureResult(result)).toBe(true);
  });
});
