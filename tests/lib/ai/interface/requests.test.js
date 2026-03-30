import { describe, expect, it } from "vitest";
import {
  createAIServiceRequest,
  createAIServiceRequestFromCommand,
  createGenerateContentPackRequest,
  createGenerateSocialRequest,
  createGenerateStoryRequest,
  isAIServiceRequest,
  readAIServiceRequestProvider,
} from "../../../../lib/ai/interface/requests";
import {
  createGenerateContentPackCommand,
  createGenerateStoryCommand,
} from "../../../../lib/shared/contracts";

describe("AI interface requests", () => {
  it("creates transport-safe service requests with generated request ids", () => {
    const request = createGenerateStoryRequest({
      dollId: "doll-1",
      payload: { name: "Rosie" },
      metadata: {
        provider: "anthropic",
        requestSource: "admin_route",
        unsafe: () => "skip",
      },
    });

    expect(request.requestId).toMatch(/^ai_/);
    expect(request).toMatchObject({
      task: "story",
      dollId: "doll-1",
      payload: { name: "Rosie" },
      metadata: {
        provider: "anthropic",
        requestSource: "admin_route",
      },
    });
    expect(isAIServiceRequest(request)).toBe(true);
    expect(readAIServiceRequestProvider(request)).toBe("anthropic");
  });

  it("creates typed content-pack and social requests", () => {
    expect(
      createGenerateContentPackRequest({
        requestId: "req_content",
        entityId: "doll-2",
        payload: { name: "Amara" },
      })
    ).toMatchObject({
      requestId: "req_content",
      task: "content_pack",
      entityId: "doll-2",
      payload: { name: "Amara" },
    });

    expect(
      createGenerateSocialRequest({
        requestId: "req_social",
        entityId: "doll-3",
        payload: { name: "Mila" },
      })
    ).toMatchObject({
      requestId: "req_social",
      task: "social",
      entityId: "doll-3",
      payload: { name: "Mila" },
    });
  });

  it("can derive a service request from an internal command envelope", () => {
    const request = createAIServiceRequestFromCommand(
      createGenerateStoryCommand({
        dollId: "doll-1",
        payload: { name: "Rosie" },
        metadata: {
          provider: "anthropic",
          requestId: "req_story",
          correlationId: "corr_1",
        },
      }),
      "story"
    );

    expect(request).toEqual({
      requestId: "req_story",
      task: "story",
      dollId: "doll-1",
      payload: { name: "Rosie" },
      metadata: {
        provider: "anthropic",
        requestId: "req_story",
        correlationId: "corr_1",
      },
    });

    expect(() =>
      createAIServiceRequestFromCommand(
        createGenerateContentPackCommand({
          dollId: "doll-1",
          payload: { name: "Rosie" },
        }),
        "invalid"
      )
    ).toThrow("Invalid AI service task.");
  });

  it("rejects malformed service requests", () => {
    expect(isAIServiceRequest(createAIServiceRequest({ task: "story", payload: {} }))).toBe(true);
    expect(isAIServiceRequest({ requestId: "", task: "story", payload: {} })).toBe(false);
  });
});
