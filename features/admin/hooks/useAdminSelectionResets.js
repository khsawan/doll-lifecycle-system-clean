"use client";

import { useEffect } from "react";
import {
  buildEditablePlayActivityState,
  emptyGeneratedContentEditorState,
  emptyPlayActivityState,
} from "../domain/content";

export function useAdminSelectionResets({
  selectedId,
  setQrUploading,
  setShowQrRegenerateWarning,
  setDangerAction,
  setDangerConfirmText,
  setDangerLoading,
  setPlayActivity,
  setStoryVariations,
  setSelectedStoryVariationId,
  setStorySaving,
  setContentPackGenerating,
  setContentPackSaving,
  setContentPackVariations,
  setSelectedContentPackVariationId,
  setSocialGenerating,
  setSocialSaving,
  setSocialVariations,
  setSelectedSocialVariationId,
  setCommerceSaving,
  setPipelineStageCompleting,
  setPipelineStageReopening,
  setStageActionWarning,
  setGeneratedContentEditState,
  setGeneratedContentSavingState,
  setIntroScriptDraft,
  setStoryPageDrafts,
  setPlayActivityDraft,
}) {
  useEffect(() => {
    setQrUploading(false);
    setShowQrRegenerateWarning(false);
    setDangerAction(null);
    setDangerConfirmText("");
    setDangerLoading("");
    setPlayActivity(emptyPlayActivityState());
    setStoryVariations([]);
    setSelectedStoryVariationId("");
    setStorySaving(false);
    setContentPackGenerating(false);
    setContentPackSaving(false);
    setContentPackVariations([]);
    setSelectedContentPackVariationId("");
    setSocialGenerating(false);
    setSocialSaving(false);
    setSocialVariations([]);
    setSelectedSocialVariationId("");
    setCommerceSaving(false);
    setPipelineStageCompleting("");
    setPipelineStageReopening("");
    setStageActionWarning(null);
    setGeneratedContentEditState(emptyGeneratedContentEditorState());
    setGeneratedContentSavingState(emptyGeneratedContentEditorState());
    setIntroScriptDraft("");
    setStoryPageDrafts(["", "", "", ""]);
    setPlayActivityDraft(buildEditablePlayActivityState());
  }, [
    selectedId,
    setQrUploading,
    setCommerceSaving,
    setContentPackGenerating,
    setContentPackSaving,
    setContentPackVariations,
    setDangerAction,
    setDangerConfirmText,
    setDangerLoading,
    setGeneratedContentEditState,
    setGeneratedContentSavingState,
    setIntroScriptDraft,
    setPipelineStageCompleting,
    setPipelineStageReopening,
    setPlayActivity,
    setPlayActivityDraft,
    setSelectedContentPackVariationId,
    setSelectedSocialVariationId,
    setSelectedStoryVariationId,
    setShowQrRegenerateWarning,
    setSocialGenerating,
    setSocialSaving,
    setSocialVariations,
    setStageActionWarning,
    setStoryPageDrafts,
    setStorySaving,
    setStoryVariations,
  ]);
}
