import { slugify } from "./content";

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildAdminPublicLinkState({
  selected,
  identity,
  publicBaseUrl = "",
  previousLockState,
} = {}) {
  const savedSlug = trimString(selected?.slug);
  const selectedLockId = selected?.id || null;
  const hasQrCode = Boolean(trimString(selected?.qr_code_url));
  const shouldRefreshLock = previousLockState?.id !== selectedLockId;
  const nextLockState = shouldRefreshLock
    ? {
        id: selectedLockId,
        legacyLockedSlug:
          !savedSlug && hasQrCode
            ? slugify(selected?.name || selected?.internal_id || "")
            : "",
      }
    : previousLockState || {
        id: selectedLockId,
        legacyLockedSlug: "",
      };
  const legacyLockedSlug = trimString(nextLockState.legacyLockedSlug);
  const slugLocked = Boolean(savedSlug || hasQrCode);
  const selectedSlug =
    savedSlug ||
    legacyLockedSlug ||
    slugify(identity?.name || selected?.name || selected?.internal_id || "");
  const publicPath = selectedSlug ? `/doll/${selectedSlug}` : "";
  const publicUrl = selectedSlug && publicBaseUrl ? `${publicBaseUrl}${publicPath}` : "";

  return {
    savedSlug,
    legacyLockedSlug,
    slugLocked,
    selectedSlug,
    publicPath,
    publicUrl,
    nextLockState,
  };
}
