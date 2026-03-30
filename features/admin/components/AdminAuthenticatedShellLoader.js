"use client";

import { useAdminPageShellController } from "../hooks/useAdminPageShellController";
import { AdminAuthenticatedShell } from "./AdminAuthenticatedShell";

export function AdminAuthenticatedShellLoader({ pageAccessControllerState }) {
  const { authenticatedShellState } = useAdminPageShellController({
    pageAccessControllerState,
  });

  return <AdminAuthenticatedShell state={authenticatedShellState} />;
}
