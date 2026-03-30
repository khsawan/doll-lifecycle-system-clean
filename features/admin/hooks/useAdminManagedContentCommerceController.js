"use client";

import { useAdminCommerceEditorController } from "./useAdminCommerceEditorController";
import { useAdminManagedContentController } from "./useAdminManagedContentController";

export function useAdminManagedContentCommerceController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const commerceControllerState = useAdminCommerceEditorController({
    workspaceControllerState,
    setError,
    setNotice,
  });
  const managedContentControllerState = useAdminManagedContentController({
    workspaceControllerState,
    setError,
    setNotice,
  });

  return {
    ...commerceControllerState,
    ...managedContentControllerState,
  };
}
