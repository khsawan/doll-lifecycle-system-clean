"use client";

import {
  AdminAccessCheckingScreen,
  AdminLoginScreen,
} from "../../features/admin/components/AdminAccessScreens";
import { useAdminAccess } from "../../features/admin/hooks/useAdminAccess";
import {
  inputStyle,
  labelStyle,
  primaryButton,
} from "../../features/admin/styles/primitives";
import { SettingsPageContent } from "../../features/settings/components/SettingsPageContent";
import { useAdminSettings } from "../../features/settings/hooks/useAdminSettings";

export default function SettingsPage() {
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
  const {
    settings,
    loading,
    savingSection,
    notice,
    error,
    updateSetting,
    saveSection,
    isSectionDirty,
    isSectionSaved,
  } = useAdminSettings({
    isEnabled: authChecked && isAuthenticated,
  });

  if (!authChecked) {
    return <AdminAccessCheckingScreen />;
  }

  if (adminProtectionEnabled && !isAuthenticated) {
    return (
      <AdminLoginScreen
        loginError={loginError}
        loginPassword={loginPassword}
        onPasswordChange={(value) => {
          setLoginPassword(value);
          setLoginError("");
        }}
        onSubmit={handleLogin}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        primaryButton={primaryButton}
      />
    );
  }

  return (
    <SettingsPageContent
      adminProtectionEnabled={adminProtectionEnabled}
      onLogout={handleLogout}
      notice={notice}
      error={error}
      loading={loading}
      settings={settings}
      savingSection={savingSection}
      onSettingChange={updateSetting}
      onSaveSection={saveSection}
      isSectionDirty={isSectionDirty}
      isSectionSaved={isSectionSaved}
    />
  );
}
