"use client";

import { useEffect, useRef, useState } from "react";
import {
  emptyContentPackState,
  emptyOrderState,
  emptyPlayActivityState,
  emptyStoryState,
} from "../domain/content";
import { buildAdminDollDetailState } from "../domain/detailState";
import { fetchAdminDollDetailResources } from "../services/detailApi";
import { fetchAdminUniverseDetail } from "../services/universeApi";

const EMPTY_IDENTITY_STATE = {
  name: "",
  theme_name: "Unassigned",
  personality_traits: "",
  emotional_hook: "",
  social_hook: "",
  social_caption: "",
  social_cta: "",
  social_status: "draft",
  short_intro: "",
  image_url: "",
  color_palette: "",
  notable_features: "",
  expression_feel: "",
  character_world: "",
  emotional_spark: "",
  emotional_essence: "",
  temperament: "",
  emotional_role: "",
  small_tenderness: "",
  signature_trait: "",
  sample_voice_line: "",
  universe_id: null,
  doll_id: null,
};

export function useAdminDetailState({
  isEnabled,
  selected,
  dolls,
  generatedV1ContentByDoll,
  setError,
  fetcher = typeof fetch === "undefined" ? null : fetch,
}) {
  const [identity, setIdentity] = useState(EMPTY_IDENTITY_STATE);
  const [story, setStory] = useState(emptyStoryState);
  const [savedStorySnapshot, setSavedStorySnapshot] = useState(null);
  const [contentPack, setContentPack] = useState(emptyContentPackState);
  const [savedContentPackSnapshot, setSavedContentPackSnapshot] = useState(null);
  const [order, setOrder] = useState(emptyOrderState);
  const [savedSocialSnapshot, setSavedSocialSnapshot] = useState(null);
  const [playActivity, setPlayActivity] = useState(emptyPlayActivityState);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [commerceStatus, setCommerceStatus] = useState("draft");
  const [universeRecord, setUniverseRecord] = useState(null);
  const dollsRef = useRef(dolls);
  const generatedContentRef = useRef(generatedV1ContentByDoll);

  useEffect(() => {
    dollsRef.current = dolls;
  }, [dolls]);

  useEffect(() => {
    generatedContentRef.current = generatedV1ContentByDoll;
  }, [generatedV1ContentByDoll]);

  useEffect(() => {
    if (!isEnabled || !selected?.id) {
      return;
    }

    let isCancelled = false;

    async function loadDetails() {
      setError("");
      setUniverseRecord(null);

      try {
        if (!fetcher) {
          throw new Error("Could not load doll details.");
        }

        const doll = dollsRef.current.find((record) => record.id === selected.id);
        const { stories, contentRows, orders } = await fetchAdminDollDetailResources(
          fetcher,
          selected.id
        );

        if (isCancelled) {
          return;
        }

        let resolvedUniverseRecord = null;
        if (doll?.universe_id) {
          try {
            const universeData = await fetchAdminUniverseDetail(fetcher, doll.universe_id);
            resolvedUniverseRecord = universeData.universe || null;
          } catch {
            // Universe fetch failure is non-fatal; generation falls back to existing behavior
          }
        }

        if (isCancelled) {
          return;
        }

        setUniverseRecord(resolvedUniverseRecord);

        const detailState = buildAdminDollDetailState({
          doll,
          localGeneratedContent: generatedContentRef.current[selected.id],
          stories,
          contentRows,
          orders,
        });

        setCommerceStatus(detailState.commerceStatus);
        if (detailState.identity) {
          setIdentity({
            ...detailState.identity,
            universe_id: doll?.universe_id || null,
            doll_id: doll?.id || null,
          });
        }
        setSavedSocialSnapshot(detailState.savedSocialSnapshot);
        setQrDataUrl(detailState.qrDataUrl);
        setStory(detailState.story);
        setSavedStorySnapshot(detailState.savedStorySnapshot);
        setContentPack(detailState.contentPack);
        setSavedContentPackSnapshot(detailState.savedContentPackSnapshot);
        setOrder(detailState.order);
        setPlayActivity(detailState.playActivity);
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load doll details."
          );
        }
      }
    }

    void loadDetails();

    return () => {
      isCancelled = true;
    };
  }, [fetcher, isEnabled, selected?.id, setError]);

  return {
    identity,
    setIdentity,
    story,
    setStory,
    savedStorySnapshot,
    setSavedStorySnapshot,
    contentPack,
    setContentPack,
    savedContentPackSnapshot,
    setSavedContentPackSnapshot,
    order,
    setOrder,
    savedSocialSnapshot,
    setSavedSocialSnapshot,
    playActivity,
    setPlayActivity,
    qrDataUrl,
    setQrDataUrl,
    commerceStatus,
    setCommerceStatus,
    universeRecord,
  };
}
