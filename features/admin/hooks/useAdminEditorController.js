"use client";

import { useAdminContentEditorController } from "./useAdminContentEditorController";
import { useAdminManagedContentCommerceController } from "./useAdminManagedContentCommerceController";

export function useAdminEditorController({
  workspaceControllerState,
  setError,
  setNotice,
}) {
  const contentEditorControllerState = useAdminContentEditorController({
    workspaceControllerState,
    setError,
    setNotice,
  });
  const managedContentCommerceControllerState =
    useAdminManagedContentCommerceController({
      workspaceControllerState,
      setError,
      setNotice,
    });

  return {
    ...contentEditorControllerState,
    ...managedContentCommerceControllerState,
  };
}
