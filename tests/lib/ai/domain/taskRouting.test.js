import { describe, expect, it } from "vitest";
import {
  AI_PROVIDERS,
  AI_SETTING_KEYS,
  AI_TASKS,
  normalizeAIProvider,
  normalizeAITask,
  resolveAIProvider,
  resolveAITask,
} from "../../../../lib/ai/domain/taskRouting";

describe("AI task routing", () => {
  it("normalizes supported AI tasks and providers", () => {
    expect(normalizeAITask(" Story ")).toBe(AI_TASKS.STORY);
    expect(normalizeAITask("content_pack")).toBe(AI_TASKS.CONTENT_PACK);
    expect(normalizeAIProvider(" ANTHROPIC ")).toBe(AI_PROVIDERS.ANTHROPIC);
    expect(normalizeAIProvider(" GOOGLE ")).toBe(AI_PROVIDERS.GOOGLE);
  });

  it("resolves supported tasks and falls back to the default provider", () => {
    expect(resolveAITask("social")).toBe(AI_TASKS.SOCIAL);
    expect(resolveAIProvider("")).toBe(AI_PROVIDERS.ANTHROPIC);
    expect(resolveAIProvider("google")).toBe(AI_PROVIDERS.GOOGLE);
    expect(AI_SETTING_KEYS).toEqual(["ai_provider", "ai_model"]);
  });

  it("throws for unsupported tasks and providers", () => {
    expect(() => resolveAITask("unknown")).toThrow("Unsupported AI task: unknown");
    expect(() => resolveAIProvider("openai")).toThrow("Unsupported AI provider: openai");
  });
});
