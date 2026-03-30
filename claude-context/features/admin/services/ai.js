import {
  mergeV1GeneratedContentWithFallback,
  readContentPackVariationCandidates,
  readSocialVariationCandidates,
  readStoryVariationCandidates,
} from "../domain/content";
import {
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

const DEFAULT_PROVIDER = "anthropic";

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function postAdminAIGeneration(fetcher, task, payload, defaultErrorMessage) {
  const response = await fetcher("/api/ai/generate", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      provider: DEFAULT_PROVIDER,
      task,
      payload,
    }),
  });

  const data = await response.json().catch(() => null);
  const resultData = readSuccessResultData(data, data || {});

  if (!response.ok) {
    throw new Error(readFailureResultMessage(data, defaultErrorMessage));
  }

  return resultData;
}

export async function generateAdminStory(fetcher, payload) {
  const data = await postAdminAIGeneration(fetcher, "story", payload, "Failed to generate story.");
  const nextStoryVariations = readStoryVariationCandidates(data?.result);
  const generatedMainStory =
    nextStoryVariations[0]?.story_main || trimString(data?.result?.story_main);

  if (!generatedMainStory) {
    throw new Error("Story generation returned an empty result.");
  }

  const variations =
    nextStoryVariations.length >= 1
      ? nextStoryVariations
      : [
          {
            id: "v1",
            label: "Version 1",
            story_main: generatedMainStory,
          },
        ];

  return {
    result: data?.result || {},
    variations,
    primaryVariation: variations[0],
  };
}

export async function generateAdminContentPack(fetcher, payload) {
  const data = await postAdminAIGeneration(
    fetcher,
    "content_pack",
    payload,
    "Failed to generate content pack."
  );
  const result = data?.result || {};
  const nextContentPack = {
    caption: trimString(result.short_intro),
    hook: trimString(result.promo_hook),
    blurb: trimString(result.content_blurb),
    cta: trimString(result.cta),
  };

  if (
    !nextContentPack.caption ||
    !nextContentPack.hook ||
    !nextContentPack.blurb ||
    !nextContentPack.cta
  ) {
    throw new Error("Content pack generation returned incomplete data.");
  }

  const nextContentPackVariations = readContentPackVariationCandidates(result);
  const variations =
    nextContentPackVariations.length >= 1
      ? nextContentPackVariations
      : [
          {
            id: "v1",
            label: "Version 1",
            short_intro: nextContentPack.caption,
            content_blurb: nextContentPack.blurb,
            promo_hook: nextContentPack.hook,
            cta: nextContentPack.cta,
          },
        ];

  return {
    result,
    contentPack: nextContentPack,
    variations,
    primaryVariation: variations[0],
  };
}

export async function generateAdminSocialContent(fetcher, payload) {
  const data = await postAdminAIGeneration(
    fetcher,
    "social",
    payload,
    "Failed to generate social content."
  );
  const result = data?.result || {};
  const nextSocialContent = {
    social_hook: trimString(result.social_hook),
    social_caption: trimString(result.social_caption),
    social_cta: trimString(result.social_cta),
  };

  if (
    !nextSocialContent.social_hook ||
    !nextSocialContent.social_caption ||
    !nextSocialContent.social_cta
  ) {
    throw new Error("Social generation returned incomplete data.");
  }

  const nextSocialVariations = readSocialVariationCandidates(result);
  const variations =
    nextSocialVariations.length >= 1
      ? nextSocialVariations
      : [
          {
            id: "v1",
            label: "Version 1",
            social_hook: nextSocialContent.social_hook,
            social_caption: nextSocialContent.social_caption,
            social_cta: nextSocialContent.social_cta,
          },
        ];

  return {
    result,
    socialContent: nextSocialContent,
    variations,
    primaryVariation: variations[0],
  };
}

export async function generateAdminManagedContent(fetcher, payload, fallbackGeneratedContent) {
  let generatedContent = fallbackGeneratedContent;
  let usedFallback = false;
  let fallbackReason = "";

  try {
    const data = await postAdminAIGeneration(
      fetcher,
      "v1_content",
      payload,
      "Failed to generate content with AI."
    );

    generatedContent = mergeV1GeneratedContentWithFallback(
      data?.result || {},
      fallbackGeneratedContent
    );
  } catch (error) {
    usedFallback = true;
    fallbackReason = error?.message || "Failed to generate content with AI.";
    generatedContent = fallbackGeneratedContent;
  }

  return {
    generatedContent,
    usedFallback,
    fallbackReason,
  };
}
