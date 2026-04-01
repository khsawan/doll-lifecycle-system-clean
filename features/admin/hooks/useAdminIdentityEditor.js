"use client";

import { useState } from "react";
import { buildAdminAIGenerationPayload } from "../domain/generation";
import {
  buildIdentityStateFromSocialVariation,
  buildSocialSectionSnapshot,
  slugify,
} from "../domain/content";
import { generateAdminSocialContent } from "../services/ai";
import { uploadAdminDollImageViaApi } from "../services/assetApi";
import { saveAdminDollPatchViaApi } from "../services/dollApi";

export function useAdminIdentityEditor({
  selected,
  identity,
  universeRecord = null,
  slugLocked,
  setIdentity,
  setDolls,
  setSavedSocialSnapshot,
  setError,
  setNotice,
  fetcher = fetch,
}) {
  const [socialGenerating, setSocialGenerating] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialVariations, setSocialVariations] = useState([]);
  const [selectedSocialVariationId, setSelectedSocialVariationId] = useState("");

  async function saveIdentity() {
    if (!selected) return;

    const nextSocialSnapshot = buildSocialSectionSnapshot(identity);

    setSocialSaving(true);
    setError("");
    setNotice("");

    const patch = {
      name: identity.name,
      theme_name: identity.theme_name,
      personality_traits: identity.personality_traits,
      emotional_hook: identity.emotional_hook,
      social_hook: identity.social_hook,
      social_caption: identity.social_caption,
      social_cta: identity.social_cta,
      social_status: identity.social_status,
      short_intro: identity.short_intro,
      image_url: identity.image_url,
      color_palette: identity.color_palette,
      notable_features: identity.notable_features,
      expression_feel: identity.expression_feel,
      character_world: identity.character_world,
      emotional_spark: identity.emotional_spark,
      emotional_essence: identity.emotional_essence,
      temperament: identity.temperament,
      emotional_role: identity.emotional_role,
      small_tenderness: identity.small_tenderness,
      signature_trait: identity.signature_trait,
      sample_voice_line: identity.sample_voice_line,
      status: selected.status === "new" ? "identity" : selected.status,
    };

    if (!slugLocked) {
      patch.slug = slugify(identity.name || selected.internal_id);
    }

    try {
      const { dollPatch } = await saveAdminDollPatchViaApi(fetcher, selected.id, patch);

      setDolls((prev) =>
        prev.map((doll) => (doll.id === selected.id ? { ...doll, ...dollPatch } : doll))
      );
      setSavedSocialSnapshot(nextSocialSnapshot);
      setNotice("Identity saved.");
    } catch (error) {
      setError(error.message);
    } finally {
      setSocialSaving(false);
    }
  }

  function applySocialVariationToEditor(variation) {
    const nextIdentity = buildIdentityStateFromSocialVariation(identity, variation);

    if (
      nextIdentity.social_hook === identity.social_hook &&
      nextIdentity.social_caption === identity.social_caption &&
      nextIdentity.social_cta === identity.social_cta
    ) {
      return;
    }

    setSelectedSocialVariationId(variation.id || "");
    setIdentity(nextIdentity);
  }

  async function generateSocialContent() {
    if (!selected) return;

    setError("");
    setNotice("");
    setSocialGenerating(true);

    try {
      const { primaryVariation, variations } = await generateAdminSocialContent(
        fetcher,
        buildAdminAIGenerationPayload({ selected, identity, universeRecord })
      );

      setSocialVariations(variations);
      applySocialVariationToEditor(primaryVariation);
      setNotice("Social content generated.");
    } catch (error) {
      setError(error?.message || "Failed to generate social content.");
    } finally {
      setSocialGenerating(false);
    }
  }

  async function uploadImage(file) {
    if (!file || !selected) return;

    setError("");
    setNotice("Uploading image...");

    try {
      const { publicImageUrl } = await uploadAdminDollImageViaApi(
        fetcher,
        selected.id,
        file
      );

      setIdentity((prev) => ({ ...prev, image_url: publicImageUrl }));
      setDolls((prev) =>
        prev.map((doll) =>
          doll.id === selected.id ? { ...doll, image_url: publicImageUrl } : doll
        )
      );

      setNotice("Image uploaded.");
    } catch (error) {
      setError(error.message);
    }
  }

  return {
    socialGenerating,
    setSocialGenerating,
    socialSaving,
    setSocialSaving,
    socialVariations,
    setSocialVariations,
    selectedSocialVariationId,
    setSelectedSocialVariationId,
    saveIdentity,
    applySocialVariationToEditor,
    generateSocialContent,
    uploadImage,
  };
}
