"use client";

import { useAdminPageAccessController } from "./useAdminPageAccessController";
import { useAdminPageShellController } from "./useAdminPageShellController";

export function useAdminPageController() {
  const pageAccessControllerState = useAdminPageAccessController();
  const { authenticatedShellState } = useAdminPageShellController({
    pageAccessControllerState,
  });

  return {
    authChecked: pageAccessControllerState.authChecked,
    adminProtectionEnabled: pageAccessControllerState.adminProtectionEnabled,
    isAuthenticated: pageAccessControllerState.isAuthenticated,
    loginError: pageAccessControllerState.loginError,
    loginPassword: pageAccessControllerState.loginPassword,
    handleLoginPasswordChange: pageAccessControllerState.handleLoginPasswordChange,
    handleLogin: pageAccessControllerState.handleLogin,
    authenticatedShellState,
  };
}
