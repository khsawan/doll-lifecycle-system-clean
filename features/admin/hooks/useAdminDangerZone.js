"use client";

import { useState } from "react";
import {
  emptyContentPackState,
  emptyOrderState,
  emptyStoryState,
  extractDollAssetPath,
} from "../domain/content";
import {
  deleteAdminDollPermanentlyViaApi,
  saveAdminDollPatchViaApi,
} from "../services/dollApi";

export function useAdminDangerZone({
  selected,
  dolls,
  dangerNeedsArchiveWarning,
  dangerNeedsTypedDelete,
  setDolls,
  setSelectedId,
  setQrDataUrl,
  setStory,
  setContentPack,
  setOrder,
  setError,
  setNotice,
  fetcher = typeof fetch === "undefined" ? null : fetch,
}) {
  const [dangerAction, setDangerAction] = useState(null);
  const [dangerConfirmText, setDangerConfirmText] = useState("");
  const [dangerLoading, setDangerLoading] = useState("");

  async function archiveDoll() {
    if (!selected) return;

    setDangerLoading("archive");
    setError("");
    setNotice("");

    try {
      const { dollPatch } = await saveAdminDollPatchViaApi(fetcher, selected.id, {
        status: "archived",
      });

      setDolls((prev) =>
        prev.map((doll) => (doll.id === selected.id ? { ...doll, ...dollPatch } : doll))
      );
      setDangerAction(null);
      setNotice("Doll archived. Its digital identity and related records remain intact.");
    } catch (error) {
      setError(error.message);
    } finally {
      setDangerLoading("");
    }
  }

  function requestArchiveDoll() {
    if (dangerNeedsArchiveWarning) {
      setDangerAction("archive");
      return;
    }

    void archiveDoll();
  }

  function requestPermanentDelete() {
    setDangerAction("delete");
    setDangerConfirmText("");
  }

  function cancelDangerAction() {
    setDangerAction(null);
    setDangerConfirmText("");
  }

  async function deleteDollPermanently() {
    if (!selected) return;

    if (dangerNeedsTypedDelete && dangerConfirmText !== "DELETE") {
      setError('Type DELETE to confirm permanent removal for this doll.');
      return;
    }

    setDangerLoading("delete");
    setError("");
    setNotice("");

    const storagePaths = Array.from(
      new Set(
        [extractDollAssetPath(selected.qr_code_url), extractDollAssetPath(selected.image_url)].filter(Boolean)
      )
    );

    const deletedId = selected.id;
    const nextSelected = dolls.find((doll) => doll.id !== deletedId) || null;

    try {
      await deleteAdminDollPermanentlyViaApi(fetcher, deletedId, {
        storagePaths,
      });

      setDolls((prev) => prev.filter((doll) => doll.id !== deletedId));
      setSelectedId(nextSelected?.id || null);
      setQrDataUrl("");
      setStory(emptyStoryState());
      setContentPack(emptyContentPackState());
      setOrder(emptyOrderState());
      setDangerAction(null);
      setDangerConfirmText("");
      setNotice(
        "Doll permanently deleted. Its linked content, orders, QR, and image files were cleaned up."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setDangerLoading("");
    }
  }

  return {
    dangerAction,
    setDangerAction,
    dangerConfirmText,
    setDangerConfirmText,
    dangerLoading,
    setDangerLoading,
    archiveDoll,
    requestArchiveDoll,
    requestPermanentDelete,
    cancelDangerAction,
    deleteDollPermanently,
  };
}
