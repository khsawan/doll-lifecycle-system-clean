import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/admin/hooks/useAdminBrowserActions", () => ({
  useAdminBrowserActions: vi.fn(),
}));

import { useAdminBrowserActions } from "../../../../features/admin/hooks/useAdminBrowserActions";
import { useAdminShellFeedbackController } from "../../../../features/admin/hooks/useAdminShellFeedbackController";

function HookProbe({ onValue }) {
  onValue(useAdminShellFeedbackController());

  return createElement("div", null, "probe");
}

describe("admin shell feedback controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates feedback state and wires browser actions to it", () => {
    const browserActionsState = {
      copyToClipboard: vi.fn(),
      openPublicPage: vi.fn(),
    };

    useAdminBrowserActions.mockReturnValue(browserActionsState);

    let result;
    renderToStaticMarkup(
      createElement(HookProbe, {
        onValue: (value) => {
          result = value;
        },
      })
    );

    expect(useAdminBrowserActions).toHaveBeenCalledWith({
      setNotice: expect.any(Function),
      setError: expect.any(Function),
    });
    expect(result).toEqual({
      notice: "",
      setNotice: expect.any(Function),
      error: "",
      setError: expect.any(Function),
      browserActionsState,
    });
  });
});
