"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CONTENT_MANAGEMENT_STATE } from "../constants/content";
import {
  buildLocalContentManagementState,
  buildLocalV1GeneratedContentState,
  emptyV1GeneratedContentState,
  hasV1GeneratedContent,
} from "../domain/content";
import { saveAdminDollPatchViaApi } from "../services/dollApi";

export function useAdminManagedContentState({
  selected,
  setDolls,
  setError,
  fetcher = typeof fetch === "undefined" ? null : fetch,
}) {
  const [contentManagementByDoll, setContentManagementByDoll] = useState({});
  const [generatedV1ContentByDoll, setGeneratedV1ContentByDoll] = useState({});

  const selectedContentManagement = useMemo(() => {
    if (!selected) {
      return DEFAULT_CONTENT_MANAGEMENT_STATE;
    }

    return contentManagementByDoll[selected.id] || buildLocalContentManagementState(selected);
  }, [contentManagementByDoll, selected]);

  const selectedGeneratedV1Content = useMemo(() => {
    if (!selected) {
      return emptyV1GeneratedContentState();
    }

    if (generatedV1ContentByDoll[selected.id]) {
      return buildLocalV1GeneratedContentState(generatedV1ContentByDoll[selected.id]);
    }

    if (hasV1GeneratedContent(selected)) {
      return buildLocalV1GeneratedContentState({
        intro_script: selected.intro_script,
        story_pages: selected.story_pages,
        play_activity: selected.play_activity,
      });
    }

    return emptyV1GeneratedContentState();
  }, [generatedV1ContentByDoll, selected]);

  useEffect(() => {
    if (!selected?.id) {
      return;
    }

    const derivedContentManagementState = buildLocalContentManagementState(selected);

    setContentManagementByDoll((prev) => {
      const existingState = prev[selected.id];

      if (!existingState) {
        return {
          ...prev,
          [selected.id]: derivedContentManagementState,
        };
      }

      if (
        existingState.generation_status === "generated" ||
        derivedContentManagementState.generation_status !== "generated"
      ) {
        return prev;
      }

      return {
        ...prev,
        [selected.id]: {
          ...existingState,
          generation_status: "generated",
        },
      };
    });
  }, [selected]);

  async function updateSelectedContentManagement(patch) {
    if (!selected?.id) return;

    setContentManagementByDoll((prev) => ({
      ...prev,
      [selected.id]: {
        ...selectedContentManagement,
        ...patch,
      },
    }));

    if (!fetcher) {
      setError("Content status updated locally but could not be saved.");
      return;
    }

    try {
      const { dollPatch } = await saveAdminDollPatchViaApi(fetcher, selected.id, patch);

      setDolls((prev) =>
        prev.map((doll) => (doll.id === selected.id ? { ...doll, ...dollPatch } : doll))
      );
    } catch (saveError) {
      setError(
        `Content status updated locally but could not be saved. ${saveError.message}`
      );
    }
  }

  return {
    contentManagementByDoll,
    generatedV1ContentByDoll,
    setGeneratedV1ContentByDoll,
    selectedContentManagement,
    selectedGeneratedV1Content,
    updateSelectedContentManagement,
  };
}
