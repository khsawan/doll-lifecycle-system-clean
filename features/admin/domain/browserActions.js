export function resolveClipboardCopyError(hasClipboardWriteText) {
  return hasClipboardWriteText ? "" : "Clipboard copy failed.";
}

export function resolvePublicPageOpenError({ url, hasWindowOpen } = {}) {
  if (!url) {
    return "No public URL is available for this doll.";
  }

  if (!hasWindowOpen) {
    return "Opening a new tab is not available in this environment.";
  }

  return "";
}
