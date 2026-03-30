"use client";

import { useState } from "react";
import { buildAdminAIGenerationPayload } from "../domain/generation";
import {
  buildContentPackSectionSnapshot,
  buildContentPackStateFromVariation,
} from "../domain/content";
import { generateAdminContentPack } from "../services/ai";
import { saveAdminContentPackViaApi } from "../services/detailApi";

export function useAdminContentPackEditor({
  selected,
  identity,
  contentPack,
  setContentPack,
  setDolls,
  setSavedContentPackSnapshot,
  setError,
  setNotice,
  fetcher = fetch,
}) {
  const [contentPackGenerating, setContentPackGenerating] = useState(false);
  const [contentPackSaving, setContentPackSaving] = useState(false);
  const [contentPackVariations, setContentPackVariations] = useState([]);
  const [selectedContentPackVariationId, setSelectedContentPackVariationId] = useState("");

  function applyContentPackVariationToEditor(variation) {
    const nextContentPack = buildContentPackStateFromVariation(variation, contentPack);

    if (
      nextContentPack.caption === contentPack.caption &&
      nextContentPack.hook === contentPack.hook &&
      nextContentPack.blurb === contentPack.blurb &&
      nextContentPack.cta === contentPack.cta
    ) {
      return;
    }

    setSelectedContentPackVariationId(variation.id || "");
    setContentPack(nextContentPack);
  }

  async function generateContentPack() {
    if (!selected) return;

    setError("");
    setNotice("");
    setContentPackGenerating(true);

    try {
      const { primaryVariation, variations } = await generateAdminContentPack(
        fetcher,
        buildAdminAIGenerationPayload({ selected, identity })
      );

      setContentPackVariations(variations);
      applyContentPackVariationToEditor(primaryVariation);
      setNotice("Content pack generated.");
    } catch (error) {
      setError(error?.message || "Failed to generate content pack.");
    } finally {
      setContentPackGenerating(false);
    }
  }

  async function saveContentPack() {
    if (!selected) return;

    const contentPackToSave = buildContentPackSectionSnapshot(contentPack);

    setContentPackSaving(true);
    setError("");
    setNotice("");

    try {
      const { dollPatch } = await saveAdminContentPackViaApi(
        fetcher,
        selected.id,
        contentPackToSave
      );

      setDolls((prev) =>
        prev.map((doll) => (doll.id === selected.id ? { ...doll, ...dollPatch } : doll))
      );

      setSavedContentPackSnapshot(contentPackToSave);
      setNotice("Content pack saved.");
    } catch (error) {
      setError(error.message);
    } finally {
      setContentPackSaving(false);
    }
  }

  return {
    contentPackGenerating,
    setContentPackGenerating,
    contentPackSaving,
    setContentPackSaving,
    contentPackVariations,
    setContentPackVariations,
    selectedContentPackVariationId,
    setSelectedContentPackVariationId,
    applyContentPackVariationToEditor,
    generateContentPack,
    saveContentPack,
  };
}
