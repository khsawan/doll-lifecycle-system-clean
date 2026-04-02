"use client";

import { useEffect, useState } from "react";
import { buildAdminAIGenerationPayload } from "../domain/generation";
import {
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

const BRIEF_FIELDS = [
  "emotional_spark",
  "emotional_essence",
  "temperament",
  "emotional_role",
  "small_tenderness",
  "signature_trait",
  "sample_voice_line",
];

export function useAdminBriefGenerator({ identity, setIdentity, fetcher = fetch }) {
  const [generating, setGenerating] = useState(false);
  const [briefError, setBriefError] = useState("");

  useEffect(() => {
    setBriefError("");
  }, [identity.doll_id]);

  async function generateBrief() {
    setGenerating(true);
    setBriefError("");

    try {
      const payload = buildAdminAIGenerationPayload({ selected: null, identity });
      const response = await fetcher("/api/ai/generate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task: "character_brief", payload }),
      });

      const data = await response.json().catch(() => null);
      const resultData = readSuccessResultData(data, data || {});

      if (!response.ok) {
        throw new Error(readFailureResultMessage(data, "Failed to generate brief."));
      }

      const result = resultData?.result || {};
      const updates = {};

      for (const field of BRIEF_FIELDS) {
        const value = typeof result[field] === "string" ? result[field].trim() : "";
        if (value) updates[field] = value;
      }

      if (Object.keys(updates).length > 0) {
        setIdentity((prev) => ({ ...prev, ...updates }));
      }
    } catch (error) {
      setBriefError(error?.message || "Failed to generate brief.");
    } finally {
      setGenerating(false);
    }
  }

  return { generating, generateBrief, briefError };
}
