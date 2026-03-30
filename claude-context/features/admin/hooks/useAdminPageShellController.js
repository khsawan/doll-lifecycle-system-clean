"use client";

import { buildAdminVersionInfo as buildAdminRuntimeVersionInfo } from "../domain/runtime";
import { useAdminAuthenticatedShellController } from "./useAdminAuthenticatedShellController";

export function useAdminPageShellController({ pageAccessControllerState }) {
  const adminVersion = buildAdminRuntimeVersionInfo({
    sha: process.env.VERCEL_GIT_COMMIT_SHA,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE,
    env: process.env.VERCEL_ENV,
  });
  const {
    authChecked,
    adminProtectionEnabled,
    isAuthenticated,
    handleLogout,
  } = pageAccessControllerState;

  return {
    authenticatedShellState: useAdminAuthenticatedShellController({
      authChecked,
      adminProtectionEnabled,
      isAuthenticated,
      handleLogout,
      adminVersionLabel: adminVersion.label,
    }),
  };
}
