"use client";

import { buildAdminContentSectionState } from "../domain/content";

export function useAdminContentSectionController({
  workspaceControllerState,
  contentSliceControllerState,
}) {
  const { detailState, workspaceViewState } = workspaceControllerState;
  const {
    storyTone,
    setStoryTone,
    storyEditorState,
    contentPackEditorState,
    identityEditorState,
  } = contentSliceControllerState;

  return {
    contentSectionState: buildAdminContentSectionState({
      isContentEditable: workspaceViewState.isContentEditable,
      hasStoryContent: workspaceViewState.hasStoryContent,
      storyTone,
      setStoryTone,
      applyTone: storyEditorState.applyTone,
      storyGenerating: storyEditorState.storyGenerating,
      saveStory: storyEditorState.saveStory,
      storyVariations: storyEditorState.storyVariations,
      selectedStoryVariationId: storyEditorState.selectedStoryVariationId,
      applyStoryVariationToEditor: storyEditorState.applyStoryVariationToEditor,
      story: detailState.story,
      setStory: detailState.setStory,
      setSelectedStoryVariationId: storyEditorState.setSelectedStoryVariationId,
      savedStorySnapshot: detailState.savedStorySnapshot,
      storySaving: storyEditorState.storySaving,
      hasContentAssets: workspaceViewState.hasContentAssets,
      generateContentPack: contentPackEditorState.generateContentPack,
      contentPackGenerating: contentPackEditorState.contentPackGenerating,
      saveContentPack: contentPackEditorState.saveContentPack,
      contentPackVariations: contentPackEditorState.contentPackVariations,
      selectedContentPackVariationId:
        contentPackEditorState.selectedContentPackVariationId,
      applyContentPackVariationToEditor:
        contentPackEditorState.applyContentPackVariationToEditor,
      contentPack: detailState.contentPack,
      setContentPack: detailState.setContentPack,
      setSelectedContentPackVariationId:
        contentPackEditorState.setSelectedContentPackVariationId,
      savedContentPackSnapshot: detailState.savedContentPackSnapshot,
      generateSocialContent: identityEditorState.generateSocialContent,
      socialGenerating: identityEditorState.socialGenerating,
      saveIdentity: identityEditorState.saveIdentity,
      socialVariations: identityEditorState.socialVariations,
      selectedSocialVariationId: identityEditorState.selectedSocialVariationId,
      applySocialVariationToEditor:
        identityEditorState.applySocialVariationToEditor,
      identity: detailState.identity,
      setIdentity: detailState.setIdentity,
      setSelectedSocialVariationId:
        identityEditorState.setSelectedSocialVariationId,
      savedSocialSnapshot: detailState.savedSocialSnapshot,
      socialSaving: identityEditorState.socialSaving,
    }),
  };
}
