import { describe, expect, it } from "vitest";
import {
  AI_SERVICE_ERROR_CODES,
  isStableAIServiceErrorCode,
  mapAIServiceErrorCode,
  normalizeAIServiceError,
} from "../../../../lib/ai/interface/errors";

describe("AI interface errors", () => {
  it("maps stable AI service error codes from common failure messages", () => {
    expect(mapAIServiceErrorCode(new Error("Invalid provider."))).toBe(
      AI_SERVICE_ERROR_CODES.INVALID_REQUEST
    );
    expect(mapAIServiceErrorCode(new Error("Anthropic request failed with status 429."))).toBe(
      AI_SERVICE_ERROR_CODES.PROVIDER_REJECTED
    );
    expect(mapAIServiceErrorCode(new Error("AI provider did not return valid JSON."))).toBe(
      AI_SERVICE_ERROR_CODES.NORMALIZATION_FAILED
    );
    expect(mapAIServiceErrorCode(new Error("Prompt build failed."))).toBe(
      AI_SERVICE_ERROR_CODES.PROMPT_BUILD_FAILED
    );
  });

  it("normalizes AI service failures with request ids and trace metadata", () => {
    const result = normalizeAIServiceError(new Error("Anthropic returned an empty response."), {
      requestId: "req_123",
      trace: {
        executionMode: "in_process",
        task: "story",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: AI_SERVICE_ERROR_CODES.NORMALIZATION_FAILED,
      message: "Anthropic returned an empty response.",
      retryable: false,
      requestId: "req_123",
      trace: {
        executionMode: "in_process",
        task: "story",
      },
    });
  });

  it("recognizes stable AI error codes", () => {
    expect(isStableAIServiceErrorCode(AI_SERVICE_ERROR_CODES.INTERNAL_ERROR)).toBe(true);
    expect(isStableAIServiceErrorCode("NOT_AI")).toBe(false);
  });
});
