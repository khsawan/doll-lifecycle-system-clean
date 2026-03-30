"use client";

import { useState } from "react";
import { useAdminBrowserActions } from "./useAdminBrowserActions";

export function useAdminShellFeedbackController() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const browserActionsState = useAdminBrowserActions({
    setNotice,
    setError,
  });

  return {
    notice,
    setNotice,
    error,
    setError,
    browserActionsState,
  };
}
