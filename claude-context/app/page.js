"use client";

import { AdminAuthenticatedShellLoader } from "../features/admin/components/AdminAuthenticatedShellLoader";
import { AdminRouteView } from "../features/admin/components/AdminRouteView";
import { useAdminPageAccessController } from "../features/admin/hooks/useAdminPageAccessController";

export default function Page() {
  const pageAccessControllerState = useAdminPageAccessController();
  const {
    authChecked,
    adminProtectionEnabled,
    isAuthenticated,
    loginError,
    loginPassword,
    handleLoginPasswordChange,
    handleLogin,
  } = pageAccessControllerState;
  const shouldRenderAuthenticatedShell =
    authChecked && (!adminProtectionEnabled || isAuthenticated);

  return (
    <AdminRouteView
      authChecked={authChecked}
      adminProtectionEnabled={adminProtectionEnabled}
      isAuthenticated={isAuthenticated}
      loginError={loginError}
      loginPassword={loginPassword}
      onPasswordChange={handleLoginPasswordChange}
      onSubmit={handleLogin}
      authenticatedShell={
        shouldRenderAuthenticatedShell ? (
          <AdminAuthenticatedShellLoader
            pageAccessControllerState={pageAccessControllerState}
          />
        ) : null
      }
    />
  );
}
