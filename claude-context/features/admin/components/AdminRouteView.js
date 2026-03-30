"use client";

import {
  AdminAccessCheckingScreen,
  AdminLoginScreen,
} from "./AdminAccessScreens";
import {
  inputStyle,
  labelStyle,
  primaryButton,
} from "../styles/primitives";

export function AdminRouteView({
  authChecked,
  adminProtectionEnabled,
  isAuthenticated,
  loginError,
  loginPassword,
  onPasswordChange,
  onSubmit,
  authenticatedShell,
}) {
  if (!authChecked) {
    return <AdminAccessCheckingScreen />;
  }

  if (adminProtectionEnabled && !isAuthenticated) {
    return (
      <AdminLoginScreen
        loginError={loginError}
        loginPassword={loginPassword}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        primaryButton={primaryButton}
      />
    );
  }

  return authenticatedShell ?? null;
}
