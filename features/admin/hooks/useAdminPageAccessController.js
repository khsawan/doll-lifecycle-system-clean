"use client";

import { useAdminAccess } from "./useAdminAccess";

export function useAdminPageAccessController() {
  const {
    isProtectionEnabled: adminProtectionEnabled,
    isAuthenticated,
    authChecked,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    handleLogin,
    handleLogout,
  } = useAdminAccess();

  function handleLoginPasswordChange(value) {
    setLoginPassword(value);
    if (loginError) {
      setLoginError("");
    }
  }

  return {
    adminProtectionEnabled,
    isAuthenticated,
    authChecked,
    loginPassword,
    loginError,
    handleLogin,
    handleLogout,
    handleLoginPasswordChange,
  };
}
