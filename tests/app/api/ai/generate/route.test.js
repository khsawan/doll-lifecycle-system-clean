import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const readAdminSessionCookieStateMock = vi.fn();
const generateStoryMock = vi.fn();
const generateContentPackMock = vi.fn();
const generateSocialMock = vi.fn();
const generateAIContentMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("../../../../../features/admin/domain/session.js", () => ({
  ADMIN_SESSION_COOKIE_NAME: "admin_session",
  buildAdminSessionCookieOptions: () => ({ path: "/" }),
  readAdminSessionCookieState: readAdminSessionCookieStateMock,
}));

vi.mock("../../../../../features/orchestrator/application/generateStory.js", () => ({
  generateStory: generateStoryMock,
}));

vi.mock("../../../../../features/orchestrator/application/generateContentPack.js", () => ({
  generateContentPack: generateContentPackMock,
}));

vi.mock("../../../../../features/orchestrator/application/generateSocial.js", () => ({
  generateSocial: generateSocialMock,
}));

vi.mock("../../../../../lib/ai/index.js", () => ({
  generateAIContent: generateAIContentMock,
}));

describe("protected AI route compatibility", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    readAdminSessionCookieStateMock.mockReset();
    generateStoryMock.mockReset();
    generateContentPackMock.mockReset();
    generateSocialMock.mockReset();
    generateAIContentMock.mockReset();

    cookiesMock.mockResolvedValue({
      get: () => ({ value: "token" }),
    });
    readAdminSessionCookieStateMock.mockReturnValue({
      authenticated: true,
      shouldClearCookie: false,
    });
  });

  it("keeps story generation responses flat for current admin callers", async () => {
    generateStoryMock.mockResolvedValue({
      ok: true,
      requestId: "req_story",
      code: "AI_GENERATION_COMPLETED",
      message: "AI content generated.",
      data: {
        task: "story",
        provider: "anthropic",
        result: {
          story_main: "Rosie explored the moonlit garden.",
        },
      },
    });

    const { POST } = await import("../../../../../app/api/ai/generate/route.js");
    const response = await POST(
      new Request("http://localhost/api/ai/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "anthropic",
          task: "story",
          payload: { name: "Rosie" },
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      task: "story",
      provider: "anthropic",
      result: {
        story_main: "Rosie explored the moonlit garden.",
      },
    });
  });
});
