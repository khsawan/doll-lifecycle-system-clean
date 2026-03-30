"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDefaultPipelineState,
  createPipelineTimestamp,
} from "../../../lib/pipelineState";
import { DEFAULT_THEMES } from "../constants/content";
import { slugify } from "../domain/content";
import { createAdminCatalogDoll, fetchAdminCatalog } from "../services/catalogApi";

export function useAdminCatalog({
  isEnabled,
  setError,
  setNotice,
  fetcher = typeof fetch === "undefined" ? null : fetch,
}) {
  const [themes, setThemes] = useState(DEFAULT_THEMES);
  const [dolls, setDolls] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newDollName, setNewDollName] = useState("");
  const [newArtistName, setNewArtistName] = useState("");
  const [newTheme, setNewTheme] = useState("Unassigned");

  const selected = useMemo(
    () => dolls.find((doll) => doll.id === selectedId) || dolls[0] || null,
    [dolls, selectedId]
  );

  async function loadCatalog() {
    if (!fetcher) {
      setError("Could not load catalog.");
      return;
    }

    try {
      setError("");
      const nextCatalog = await fetchAdminCatalog(fetcher);
      setThemes(nextCatalog.themes);
      setDolls(nextCatalog.dolls);
      setSelectedId((currentSelectedId) =>
        currentSelectedId || nextCatalog.dolls[0]?.id || null
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load catalog.");
    }
  }

  async function refreshCatalog() {
    await loadCatalog();
  }

  async function createDoll() {
    setError("");
    setNotice("");

    if (!fetcher) {
      setError("Could not create doll.");
      return;
    }

    const count = dolls.length + 1;
    const computedName = newDollName || `DOLL-${String(count).padStart(3, "0")}`;
    const pipelineTimestamp = createPipelineTimestamp();
    const defaultPipelineState = createDefaultPipelineState(pipelineTimestamp);
    const basePayload = {
      internal_id: `DOLL-${String(count).padStart(3, "0")}`,
      name: computedName,
      artist_name: newArtistName || null,
      theme_name: newTheme || "Unassigned",
      status: "new",
      availability_status: "available",
      sales_status: "not_sold",
      commerce_status: "draft",
      slug: slugify(computedName),
    };

    try {
      const next = await createAdminCatalogDoll(fetcher, {
        basePayload,
        defaultPipelineState,
        pipelineTimestamp,
      });

      setDolls((currentDolls) => [...currentDolls, next]);
      setSelectedId(next.id);
      setNewDollName("");
      setNewArtistName("");
      setNewTheme("Unassigned");
      setNotice("New doll added to the pipeline.");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let isCancelled = false;

    async function loadCatalog() {
      try {
        if (!fetcher) {
          throw new Error("Could not load catalog.");
        }

        setError("");
        const nextCatalog = await fetchAdminCatalog(fetcher);
        if (isCancelled) {
          return;
        }

        setThemes(nextCatalog.themes);
        setDolls(nextCatalog.dolls);
        setSelectedId((currentSelectedId) =>
          currentSelectedId || nextCatalog.dolls[0]?.id || null
        );
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load catalog.");
        }
      }
    }

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [fetcher, isEnabled, setError]);

  return {
    themes,
    dolls,
    setDolls,
    selectedId,
    setSelectedId,
    selected,
    newDollName,
    setNewDollName,
    newArtistName,
    setNewArtistName,
    newTheme,
    setNewTheme,
    refreshCatalog,
    createDoll,
  };
}
