"use client";

import { buildAdminAuthenticatedShellState } from "../domain/shellState";

export function useAdminAuthenticatedShellState(input) {
  return buildAdminAuthenticatedShellState(input);
}
