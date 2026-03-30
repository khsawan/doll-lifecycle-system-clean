"use client";

import {
  resolveClipboardCopyError,
  resolvePublicPageOpenError,
} from "../domain/browserActions";

export function useAdminBrowserActions({
  setNotice,
  setError,
  navigatorRef = typeof navigator === "undefined" ? null : navigator,
  windowRef = typeof window === "undefined" ? null : window,
}) {
  async function copyToClipboard(value, successMessage) {
    const clipboardError = resolveClipboardCopyError(
      Boolean(navigatorRef?.clipboard?.writeText)
    );

    if (clipboardError) {
      setError(clipboardError);
      return;
    }

    try {
      await navigatorRef.clipboard.writeText(value);
      setNotice(successMessage);
    } catch {
      setError("Clipboard copy failed.");
    }
  }

  function openPublicPage(url) {
    const openError = resolvePublicPageOpenError({
      url,
      hasWindowOpen: Boolean(windowRef?.open),
    });

    if (openError) {
      setError(openError);
      return;
    }

    windowRef.open(url, "_blank", "noopener,noreferrer");
  }

  return {
    copyToClipboard,
    openPublicPage,
  };
}
