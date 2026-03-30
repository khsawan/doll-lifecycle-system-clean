"use client";

import { useEffect, useRef, useState } from "react";

const VALID_WORKSPACES = ["pipeline", "content_studio", "dashboard"];

export function useAdminWorkspaceSelection({ currentSelectedId, setSelectedId }) {
  const [activeDepartment, setActiveDepartment] = useState("");
  const [activeStageView, setActiveStageView] = useState("");
  const [selectedWorkspaceMode, setSelectedWorkspaceMode] = useState("");
  const pendingSelectedWorkspaceModeRef = useRef("");

  useEffect(() => {
    setActiveDepartment(currentSelectedId ? "Overview" : "");
  }, [currentSelectedId]);

  useEffect(() => {
    setActiveStageView(currentSelectedId ? "overview" : "");
  }, [currentSelectedId]);

  useEffect(() => {
    if (!currentSelectedId) {
      pendingSelectedWorkspaceModeRef.current = "";
      setSelectedWorkspaceMode("");
      return;
    }

    const nextWorkspace = pendingSelectedWorkspaceModeRef.current || "dashboard";
    setSelectedWorkspaceMode(nextWorkspace);
    pendingSelectedWorkspaceModeRef.current = "";
  }, [currentSelectedId]);

  function openDollWorkspace(dollId, workspace = "dashboard") {
    const normalizedWorkspace = VALID_WORKSPACES.includes(workspace)
      ? workspace
      : "dashboard";

    if (!dollId) {
      return;
    }

    pendingSelectedWorkspaceModeRef.current = normalizedWorkspace;

    if (currentSelectedId === dollId) {
      setSelectedWorkspaceMode(normalizedWorkspace);
      pendingSelectedWorkspaceModeRef.current = "";
      return;
    }

    setSelectedId(dollId);
  }

  function selectDoll(dollId) {
    if (!dollId) {
      return;
    }

    pendingSelectedWorkspaceModeRef.current = "";

    if (currentSelectedId === dollId) {
      return;
    }

    setSelectedId(dollId);
  }

  return {
    activeDepartment,
    setActiveDepartment,
    activeStageView,
    setActiveStageView,
    selectedWorkspaceMode,
    setSelectedWorkspaceMode,
    openDollWorkspace,
    selectDoll,
  };
}
