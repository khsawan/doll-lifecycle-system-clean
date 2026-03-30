"use client";

import { useEffect, useMemo, useState } from "react";
import { buildV1Experience } from "../mappers/buildExperience";
import { fetchPublicExperienceData } from "../services/experience";

export function normalizePublicExperienceSlug(params) {
  if (!params?.slug) {
    return "";
  }

  return Array.isArray(params.slug) ? params.slug[0] : params.slug;
}

export function resolvePublicExperienceLoadError(loadError) {
  return loadError instanceof Error
    ? loadError.message
    : "We could not load this doll page right now.";
}

export function usePublicExperiencePageController({
  params,
  client,
  fetchExperienceData = fetchPublicExperienceData,
  buildExperience = buildV1Experience,
}) {
  const slug = useMemo(() => normalizePublicExperienceSlug(params), [params]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [experience, setExperience] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadExperience() {
      if (!slug) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const experienceData = await fetchExperienceData(client, slug);

        if (isCancelled) {
          return;
        }

        setExperience(buildExperience(experienceData));
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setError(resolvePublicExperienceLoadError(loadError));
        setExperience(null);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadExperience();

    return () => {
      isCancelled = true;
    };
  }, [buildExperience, client, fetchExperienceData, slug]);

  return {
    loading,
    error,
    experience,
  };
}
