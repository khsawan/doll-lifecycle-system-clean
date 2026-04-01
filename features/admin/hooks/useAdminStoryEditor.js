"use client";

import { useState } from "react";
import { buildAdminAIGenerationPayload } from "../domain/generation";
import {
  buildStoryPack,
  buildStorySectionSnapshot,
  buildStoryStateFromVariation,
} from "../domain/content";
import { generateAdminStory } from "../services/ai";
import { saveAdminStoryViaApi } from "../services/detailApi";

export function useAdminStoryEditor({
  selected,
  identity,
  universeRecord = null,
  story,
  setStoryTone,
  setStory,
  setDolls,
  setSavedStorySnapshot,
  setError,
  setNotice,
  fetcher = fetch,
}) {
  const [storyGenerating, setStoryGenerating] = useState(false);
  const [storySaving, setStorySaving] = useState(false);
  const [storyVariations, setStoryVariations] = useState([]);
  const [selectedStoryVariationId, setSelectedStoryVariationId] = useState("");

  function applyStoryVariationToEditor(variation, nextPack = null) {
    const storyMain = typeof variation?.story_main === "string" ? variation.story_main.trim() : "";

    if (!storyMain) {
      return;
    }

    setSelectedStoryVariationId(variation.id || "");
    setStory((prev) => buildStoryStateFromVariation(prev, variation, nextPack));
  }

  async function applyTone(tone) {
    setStoryTone(tone);
    if (!selected) return;

    setError("");
    setNotice("");
    setStoryGenerating(true);

    const pack = buildStoryPack({ ...selected, ...identity }, tone);
    const payload = buildAdminAIGenerationPayload({ selected, identity, tone, universeRecord });

    try {
      const { primaryVariation, variations } = await generateAdminStory(fetcher, payload);

      setStoryVariations(variations);
      applyStoryVariationToEditor(primaryVariation, pack);
      setNotice(`${tone} story pack generated.`);
    } catch (error) {
      setError(error?.message || "Failed to generate story.");
    } finally {
      setStoryGenerating(false);
    }
  }

  async function saveStory() {
    if (!selected) return;

    const storyToSave = buildStorySectionSnapshot(story);

    setStorySaving(true);
    setError("");
    setNotice("");

    try {
      const { dollPatch } = await saveAdminStoryViaApi(fetcher, selected.id, storyToSave);

      setDolls((prev) =>
        prev.map((doll) => (doll.id === selected.id ? { ...doll, ...dollPatch } : doll))
      );
      setSavedStorySnapshot(storyToSave);
      setNotice("Story saved.");
    } catch (error) {
      setError(error.message);
    } finally {
      setStorySaving(false);
    }
  }

  return {
    storyGenerating,
    setStoryGenerating,
    storySaving,
    setStorySaving,
    storyVariations,
    setStoryVariations,
    selectedStoryVariationId,
    setSelectedStoryVariationId,
    applyStoryVariationToEditor,
    applyTone,
    saveStory,
  };
}
