export function buildAdminSessionState({ authenticated, protectionEnabled } = {}) {
  if (!protectionEnabled) {
    return {
      isProtectionEnabled: false,
      isAuthenticated: true,
      authChecked: true,
    };
  }

  return {
    isProtectionEnabled: true,
    isAuthenticated: Boolean(authenticated),
    authChecked: true,
  };
}

export function resolveAdminSessionErrorMessage(errorMessage, fallbackMessage) {
  if (typeof errorMessage === "string" && errorMessage.trim()) {
    return errorMessage.trim();
  }

  return fallbackMessage;
}
