"use client";

import { useRef } from "react";
import { buildAdminPublicLinkState } from "../domain/publicLinks";
import { resolvePublicBaseUrl } from "../domain/runtime";

export function useAdminPublicLinkState({
  selected,
  identity,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  windowRef = typeof window === "undefined" ? null : window,
} = {}) {
  const slugLockRef = useRef({ id: null, legacyLockedSlug: "" });
  const publicBaseUrl = resolvePublicBaseUrl({
    siteUrl,
    origin: windowRef?.location?.origin || "",
  });
  const { nextLockState, ...publicLinkState } = buildAdminPublicLinkState({
    selected,
    identity,
    publicBaseUrl,
    previousLockState: slugLockRef.current,
  });

  slugLockRef.current = nextLockState;

  return publicLinkState;
}
