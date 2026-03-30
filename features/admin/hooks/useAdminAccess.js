"use client";

import { useEffect, useState } from "react";
import {
  buildAdminSessionState,
  resolveAdminSessionErrorMessage,
} from "../domain/access";

const DEFAULT_ADMIN_SESSION_TIMEOUT_MS = 10000;

export function useAdminAccess({
  sessionEndpoint = "/api/admin/session",
  sessionTimeoutMs = DEFAULT_ADMIN_SESSION_TIMEOUT_MS,
  fetchRef = typeof fetch === "undefined" ? null : fetch,
  windowRef = typeof window === "undefined" ? null : window,
} = {}) {
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    let isCancelled = false;
    let timeoutId = null;

    function clearSessionTimeout() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    async function fetchSession() {
      const sessionRequest = fetchRef(sessionEndpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!sessionTimeoutMs || sessionTimeoutMs <= 0) {
        return sessionRequest;
      }

      return Promise.race([
        sessionRequest,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Admin session request timed out."));
          }, sessionTimeoutMs);
        }),
      ]);
    }

    async function loadSession() {
      if (!fetchRef) {
        if (!isCancelled) {
          const nextState = buildAdminSessionState({
            authenticated: false,
            protectionEnabled: true,
          });
          setIsProtectionEnabled(nextState.isProtectionEnabled);
          setIsAuthenticated(nextState.isAuthenticated);
          setAuthChecked(nextState.authChecked);
        }
        return;
      }

      try {
        const response = await fetchSession();
        const body = await response.json().catch(() => ({}));

        if (isCancelled) {
          return;
        }

        const nextState = buildAdminSessionState(body);
        setIsProtectionEnabled(nextState.isProtectionEnabled);
        setIsAuthenticated(nextState.isAuthenticated);
        setAuthChecked(nextState.authChecked);
      } catch {
        if (isCancelled) {
          return;
        }

        const nextState = buildAdminSessionState({
          authenticated: false,
          protectionEnabled: true,
        });
        setIsProtectionEnabled(nextState.isProtectionEnabled);
        setIsAuthenticated(nextState.isAuthenticated);
        setAuthChecked(nextState.authChecked);
      } finally {
        clearSessionTimeout();
      }
    }

    void loadSession();

    return () => {
      isCancelled = true;
      clearSessionTimeout();
    };
  }, [fetchRef, sessionEndpoint, sessionTimeoutMs]);

  async function handleLogin(event) {
    event.preventDefault();

    if (!fetchRef) {
      setLoginError("Could not verify admin access.");
      return;
    }

    setLoginError("");

    try {
      const response = await fetchRef(sessionEndpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: loginPassword,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLoginError(
          resolveAdminSessionErrorMessage(
            body?.error,
            "Could not verify admin access."
          )
        );
        return;
      }

      const nextState = buildAdminSessionState(body);
      setIsProtectionEnabled(nextState.isProtectionEnabled);
      setIsAuthenticated(nextState.isAuthenticated);
      setAuthChecked(nextState.authChecked);
      setLoginPassword("");
    } catch {
      setLoginError("Could not verify admin access.");
    }
  }

  async function handleLogout() {
    try {
      if (fetchRef) {
        await fetchRef(sessionEndpoint, {
          method: "DELETE",
          credentials: "same-origin",
        });
      }
    } finally {
      windowRef?.location?.reload();
    }
  }

  return {
    isProtectionEnabled,
    isAuthenticated,
    authChecked,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    handleLogin,
    handleLogout,
  };
}
