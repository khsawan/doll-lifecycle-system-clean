import { describe, expect, it } from "vitest";
import {
  createAIRequest,
  resolveAIExecutionRequest,
} from "../../../../lib/ai/domain/requests";

describe("AI requests", () => {
  it("creates normalized AI requests", () => {
    expect(
      createAIRequest({
        provider: " anthropic ",
        task: "story",
        payload: { name: "Rosie" },
        model: " claude-custom ",
      })
    ).toEqual({
      provider: "anthropic",
      task: "story",
      payload: { name: "Rosie" },
      model: "claude-custom",
    });
  });

  it("merges request input with settings defaults", () => {
    expect(
      resolveAIExecutionRequest(
        {
          task: "content_pack",
          payload: { name: "Rosie" },
        },
        {
          ai_provider: "anthropic",
          ai_model: "claude-settings",
        }
      )
    ).toEqual({
      task: "content_pack",
      provider: "anthropic",
      payload: { name: "Rosie" },
      model: "claude-settings",
    });
  });

  it("supports google as a persisted provider default", () => {
    expect(
      resolveAIExecutionRequest(
        {
          task: "story",
          payload: { name: "Rosie" },
        },
        {
          ai_provider: "google",
          ai_model: "",
        }
      )
    ).toEqual({
      task: "story",
      provider: "google",
      payload: { name: "Rosie" },
      model: "",
    });
  });
});
