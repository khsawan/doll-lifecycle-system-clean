"use client";

import { useState } from "react";
import {
  buildEditablePlayActivityState,
  buildLocalV1GeneratedContentState,
  emptyGeneratedContentEditorState,
  generateV1ContentFromIdentity,
} from "../domain/content";
import { buildAdminManagedContentGenerationPayload } from "../domain/generation";
import { generateAdminManagedContent } from "../services/ai";
import { saveAdminDollPatchViaApi } from "../services/dollApi";

export function useAdminManagedContent({
  selected,
  identity,
  selectedContentManagement,
  selectedGeneratedV1Content,
  contentPreviewHref,
  updateSelectedContentManagement,
  setGeneratedV1ContentByDoll,
  setIdentity,
  setStory,
  setPlayActivity,
  setDolls,
  setError,
  setNotice,
  fetcher = fetch,
}) {
  const [managedContentGenerating, setManagedContentGenerating] = useState(false);
  const [generatedContentEditState, setGeneratedContentEditState] = useState(
    emptyGeneratedContentEditorState
  );
  const [generatedContentSavingState, setGeneratedContentSavingState] = useState(
    emptyGeneratedContentEditorState
  );
  const [introScriptDraft, setIntroScriptDraft] = useState("");
  const [storyPageDrafts, setStoryPageDrafts] = useState(["", "", "", ""]);
  const [playActivityDraft, setPlayActivityDraft] = useState(() =>
    buildEditablePlayActivityState()
  );

  function applyManagedGeneratedContent(generatedContent) {
    if (!selected?.id) {
      return;
    }

    setGeneratedV1ContentByDoll((prev) => ({
      ...prev,
      [selected.id]: generatedContent,
    }));
    setIdentity((prev) => ({
      ...prev,
      short_intro: generatedContent.intro_script,
    }));
    setStory({
      teaser: generatedContent.story_pages[0],
      mainStory: generatedContent.story_pages[1],
      mini1: generatedContent.story_pages[2],
      mini2: generatedContent.story_pages[3],
    });
    setPlayActivity(generatedContent.play_activity);
    updateSelectedContentManagement({ generation_status: "generated" });
  }

  function setGeneratedStoryPageEditState(pageIndex, isEditing) {
    setGeneratedContentEditState((prev) => ({
      ...prev,
      story_pages: prev.story_pages.map((value, index) =>
        index === pageIndex ? isEditing : value
      ),
    }));
  }

  function setGeneratedStoryPageSavingState(pageIndex, isSaving) {
    setGeneratedContentSavingState((prev) => ({
      ...prev,
      story_pages: prev.story_pages.map((value, index) =>
        index === pageIndex ? isSaving : value
      ),
    }));
  }

  function startIntroScriptEditing() {
    setError("");
    setNotice("");
    setIntroScriptDraft(selectedGeneratedV1Content.intro_script);
    setGeneratedContentEditState((prev) => ({
      ...prev,
      intro_script: true,
    }));
  }

  function cancelIntroScriptEditing() {
    setIntroScriptDraft(selectedGeneratedV1Content.intro_script);
    setGeneratedContentEditState((prev) => ({
      ...prev,
      intro_script: false,
    }));
  }

  function startStoryPageEditing(pageIndex) {
    setError("");
    setNotice("");
    setStoryPageDrafts((prev) => {
      const nextDrafts = [...prev];
      nextDrafts[pageIndex] = selectedGeneratedV1Content.story_pages[pageIndex] || "";
      return nextDrafts;
    });
    setGeneratedStoryPageEditState(pageIndex, true);
  }

  function cancelStoryPageEditing(pageIndex) {
    setStoryPageDrafts((prev) => {
      const nextDrafts = [...prev];
      nextDrafts[pageIndex] = selectedGeneratedV1Content.story_pages[pageIndex] || "";
      return nextDrafts;
    });
    setGeneratedStoryPageEditState(pageIndex, false);
  }

  function startPlayActivityEditing() {
    setError("");
    setNotice("");
    setPlayActivityDraft(buildEditablePlayActivityState(selectedGeneratedV1Content.play_activity));
    setGeneratedContentEditState((prev) => ({
      ...prev,
      play_activity: true,
    }));
  }

  function cancelPlayActivityEditing() {
    setPlayActivityDraft(buildEditablePlayActivityState(selectedGeneratedV1Content.play_activity));
    setGeneratedContentEditState((prev) => ({
      ...prev,
      play_activity: false,
    }));
  }

  function buildNextGeneratedContent(patch = {}) {
    return buildLocalV1GeneratedContentState({
      intro_script: selectedGeneratedV1Content.intro_script,
      story_pages: selectedGeneratedV1Content.story_pages,
      play_activity: selectedGeneratedV1Content.play_activity,
      ...patch,
    });
  }

  async function saveGeneratedContentPatch(patch, nextGeneratedContent, successMessage) {
    if (!selected?.id) {
      return false;
    }

    if (!fetcher) {
      setNotice("");
      setError("Could not save generated content.");
      return false;
    }

    setError("");
    setNotice("");

    try {
      const { dollPatch } = await saveAdminDollPatchViaApi(fetcher, selected.id, patch);

      setDolls((prev) =>
        prev.map((d) =>
          d.id === selected.id
            ? {
                ...d,
                ...dollPatch,
              }
            : d
        )
      );
    } catch (saveError) {
      setError(saveError.message);
      return false;
    }

    applyManagedGeneratedContent(nextGeneratedContent);
    setNotice(successMessage);
    return true;
  }

  async function saveIntroScriptEdit() {
    const nextGeneratedContent = buildNextGeneratedContent({
      intro_script: introScriptDraft,
    });

    setGeneratedContentSavingState((prev) => ({
      ...prev,
      intro_script: true,
    }));

    try {
      const saved = await saveGeneratedContentPatch(
        { intro_script: nextGeneratedContent.intro_script },
        nextGeneratedContent,
        "Intro script saved."
      );

      if (saved) {
        setGeneratedContentEditState((prev) => ({
          ...prev,
          intro_script: false,
        }));
      }
    } finally {
      setGeneratedContentSavingState((prev) => ({
        ...prev,
        intro_script: false,
      }));
    }
  }

  async function saveStoryPageEdit(pageIndex) {
    const nextStoryPages = selectedGeneratedV1Content.story_pages.map((page, index) =>
      index === pageIndex ? storyPageDrafts[pageIndex] || "" : page
    );
    const nextGeneratedContent = buildNextGeneratedContent({
      story_pages: nextStoryPages,
    });

    setGeneratedStoryPageSavingState(pageIndex, true);

    try {
      const saved = await saveGeneratedContentPatch(
        { story_pages: nextGeneratedContent.story_pages },
        nextGeneratedContent,
        `Story page ${pageIndex + 1} saved.`
      );

      if (saved) {
        setGeneratedStoryPageEditState(pageIndex, false);
      }
    } finally {
      setGeneratedStoryPageSavingState(pageIndex, false);
    }
  }

  async function savePlayActivityEdit() {
    const nextPlayActivity = buildEditablePlayActivityState(playActivityDraft);
    const nextGeneratedContent = buildNextGeneratedContent({
      play_activity: nextPlayActivity,
    });

    setGeneratedContentSavingState((prev) => ({
      ...prev,
      play_activity: true,
    }));

    try {
      const saved = await saveGeneratedContentPatch(
        { play_activity: nextPlayActivity },
        nextGeneratedContent,
        "Play activity saved."
      );

      if (saved) {
        setGeneratedContentEditState((prev) => ({
          ...prev,
          play_activity: false,
        }));
      }
    } finally {
      setGeneratedContentSavingState((prev) => ({
        ...prev,
        play_activity: false,
      }));
    }
  }

  async function handleGenerateManagedContent() {
    if (!selected?.id) {
      return;
    }

    setError("");
    setNotice("");
    setManagedContentGenerating(true);

    const generationPayload = buildAdminManagedContentGenerationPayload({
      selected,
      identity,
    });
    const fallbackGeneratedContent = generateV1ContentFromIdentity({
      name: generationPayload.name,
      personality: generationPayload.personality,
      world: generationPayload.world,
      mood: generationPayload.mood,
    });

    try {
      const { generatedContent, usedFallback, fallbackReason } =
        await generateAdminManagedContent(
          fetcher,
          generationPayload,
          fallbackGeneratedContent
        );

      applyManagedGeneratedContent(generatedContent);

      if (!fetcher) {
        setError(
          usedFallback
            ? `${fallbackReason} Deterministic local content was used instead, but it could not be saved.`
            : "Generated content is visible locally, but it could not be saved."
        );
        return;
      }

      const generatedContentPatch = {
        intro_script: generatedContent.intro_script,
        story_pages: generatedContent.story_pages,
        play_activity: generatedContent.play_activity,
      };

      try {
        const { dollPatch } = await saveAdminDollPatchViaApi(
          fetcher,
          selected.id,
          generatedContentPatch
        );

        setDolls((prev) =>
          prev.map((d) =>
            d.id === selected.id
              ? {
                  ...d,
                  ...dollPatch,
                }
              : d
          )
        );
      } catch (saveError) {
        setError(
          usedFallback
            ? `${fallbackReason} Deterministic local content was used instead, but it could not be saved. ${saveError.message}`
            : `Generated content is visible locally, but could not be saved. ${saveError.message}`
        );
        return;
      }

      setNotice(
        usedFallback
          ? "AI generation failed. Deterministic local content was used instead and saved to this doll."
          : "V1 content generated with AI and saved to this doll."
      );
    } catch (err) {
      setError(err?.message || "Failed to generate content with AI.");
    } finally {
      setManagedContentGenerating(false);
    }
  }

  function handlePreviewManagedContent() {
    if (!contentPreviewHref) {
      setNotice("");
      setError("No public preview route is available for this doll.");
      return;
    }

    setError("");
    window.open(contentPreviewHref, "_blank", "noopener,noreferrer");
  }

  async function handleApproveManagedContent() {
    if (selectedContentManagement.generation_status !== "generated") {
      return;
    }

    setError("");
    await updateSelectedContentManagement({ review_status: "approved" });
    setNotice("Content approved in the management layer.");
  }

  async function handlePublishManagedContent() {
    if (selectedContentManagement.review_status !== "approved") {
      return;
    }

    setError("");
    await updateSelectedContentManagement({ publish_status: "live" });
    setNotice("Content marked live in the management layer.");
  }

  async function handleUnpublishManagedContent() {
    if (selectedContentManagement.publish_status !== "live") {
      return;
    }

    setError("");
    await updateSelectedContentManagement({ publish_status: "hidden" });
    setNotice("Content hidden in the management layer.");
  }

  function generateDraft() {
    handleGenerateManagedContent();
  }

  return {
    managedContentGenerating,
    generatedContentEditState,
    setGeneratedContentEditState,
    generatedContentSavingState,
    setGeneratedContentSavingState,
    introScriptDraft,
    setIntroScriptDraft,
    storyPageDrafts,
    setStoryPageDrafts,
    playActivityDraft,
    setPlayActivityDraft,
    startIntroScriptEditing,
    cancelIntroScriptEditing,
    startStoryPageEditing,
    cancelStoryPageEditing,
    startPlayActivityEditing,
    cancelPlayActivityEditing,
    saveIntroScriptEdit,
    saveStoryPageEdit,
    savePlayActivityEdit,
    handleGenerateManagedContent,
    handlePreviewManagedContent,
    handleApproveManagedContent,
    handlePublishManagedContent,
    handleUnpublishManagedContent,
    generateDraft,
  };
}
