"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { uploadAdminQrCodeViaApi } from "../services/assetApi";
import { saveAdminDollPatchViaApi } from "../services/dollApi";

export function useAdminQrWorkflow({
  selected,
  slugLocked,
  selectedSlug,
  publicUrl,
  qrReady,
  qrReadinessMessage,
  qrDataUrl,
  setQrDataUrl,
  savedQrUrl,
  qrIsSensitive,
  printCardRef,
  setDolls,
  setError,
  setNotice,
  fetcher = fetch,
  qrCodeApi = QRCode,
  pngRenderer = toPng,
  documentRef = typeof document === "undefined" ? null : document,
  consoleRef = console,
}) {
  const [qrUploading, setQrUploading] = useState(false);
  const [showQrRegenerateWarning, setShowQrRegenerateWarning] = useState(false);

  async function activateDigitalLayer() {
    if (!selected) return;

    const patch = slugLocked ? { status: "digital" } : { slug: selectedSlug, status: "digital" };

    try {
      const { dollPatch } = await saveAdminDollPatchViaApi(fetcher, selected.id, patch);

      setDolls((prev) =>
        prev.map((doll) => (doll.id === selected.id ? { ...doll, ...dollPatch } : doll))
      );
      setNotice("Digital layer activated.");
    } catch (error) {
      setError(error.message);
    }
  }

  async function createQrCodeDataUrl() {
    if (!publicUrl) {
      setError("No public URL available for this doll.");
      return null;
    }

    try {
      return await qrCodeApi.toDataURL(publicUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    } catch (error) {
      setError(error?.message || "Failed to generate QR code.");
      return null;
    }
  }

  function ensureQrGenerationReady() {
    if (qrReady) {
      return true;
    }

    setNotice("");
    setError(qrReadinessMessage);
    return false;
  }

  async function uploadQrToSupabase(qrSource = qrDataUrl, forceRefresh = false) {
    if (!qrSource || !selected) {
      setError("Generate a QR code first.");
      return false;
    }

    setQrUploading(true);
    setError("");
    setNotice("");

    try {
      const { storedQrUrl } = await uploadAdminQrCodeViaApi(fetcher, selected.id, {
        storageKey: selectedSlug || selected.internal_id,
        qrSource,
        forceRefresh,
      });

      setDolls((prev) =>
        prev.map((doll) =>
          doll.id === selected.id ? { ...doll, qr_code_url: storedQrUrl } : doll
        )
      );

      setQrDataUrl(storedQrUrl);
      setNotice("QR code uploaded and linked to this doll.");
      return true;
    } catch (error) {
      setError(error?.message || "Failed to upload QR code.");
      return false;
    } finally {
      setQrUploading(false);
    }
  }

  async function generateQrCode() {
    if (!selected) return false;

    setError("");
    setNotice("");

    if (!ensureQrGenerationReady()) {
      return false;
    }

    const dataUrl = await createQrCodeDataUrl();
    if (!dataUrl) {
      return false;
    }

    setQrDataUrl(dataUrl);

    const saved = await uploadQrToSupabase(dataUrl);
    if (saved) {
      setNotice("QR code generated and linked to this doll.");
    }

    return saved;
  }

  async function regenerateSavedQrCode() {
    if (!selected) return;

    setError("");
    setNotice("");

    if (!ensureQrGenerationReady()) {
      return;
    }

    const dataUrl = await createQrCodeDataUrl();
    if (!dataUrl) {
      return;
    }

    setQrDataUrl(dataUrl);

    const saved = await uploadQrToSupabase(dataUrl, true);
    if (saved) {
      setNotice("QR code regenerated and linked to this doll.");
    }
  }

  function requestQrRegeneration() {
    if (!ensureQrGenerationReady()) {
      return;
    }

    if (!savedQrUrl) {
      void generateQrCode();
      return;
    }

    if (qrIsSensitive) {
      setShowQrRegenerateWarning(true);
      return;
    }

    void regenerateSavedQrCode();
  }

  async function confirmQrRegeneration() {
    setShowQrRegenerateWarning(false);

    if (!ensureQrGenerationReady()) {
      return;
    }

    await regenerateSavedQrCode();
  }

  function downloadQrCode() {
    if (!qrDataUrl || !selected) {
      setError("Generate a QR code first.");
      return;
    }

    if (!documentRef) {
      setError("QR download is not available in this environment.");
      return;
    }

    const link = documentRef.createElement("a");
    link.href = qrDataUrl;
    link.download = `${selectedSlug || selected.internal_id || "doll"}-qr.png`;
    documentRef.body.appendChild(link);
    link.click();
    documentRef.body.removeChild(link);

    setNotice("QR code downloaded.");
  }

  async function downloadPrintCard() {
    if (!printCardRef.current || !selected) {
      setError("No print card available to download.");
      return;
    }

    if (!documentRef) {
      setError("Print card download is not available in this environment.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const dataUrl = await pngRenderer(printCardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const link = documentRef.createElement("a");
      link.href = dataUrl;
      link.download = `${selectedSlug || selected.internal_id || "doll"}-print-card.png`;

      documentRef.body.appendChild(link);
      link.click();
      documentRef.body.removeChild(link);

      setNotice("Print card downloaded.");
    } catch (error) {
      consoleRef.error(error);
      setError("Failed to generate print card download.");
    }
  }

  return {
    qrUploading,
    setQrUploading,
    showQrRegenerateWarning,
    setShowQrRegenerateWarning,
    activateDigitalLayer,
    generateQrCode,
    requestQrRegeneration,
    confirmQrRegeneration,
    downloadQrCode,
    downloadPrintCard,
  };
}
