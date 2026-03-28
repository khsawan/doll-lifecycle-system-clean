function slugifySegment(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitTraits(value) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const ROSIE_SLUG = "rosie";
const ROSIE_HERO_IMAGE_URL = "/images/dolls/rosie/rosie-hero.png";
const ROSIE_STORY_PAGES = [
  {
    id: "page-1",
    text: "Rosie stepped into the quiet farmyard, where soft morning light touched the wooden fence and little chickens wandered gently through the grass.",
    image_url: "/images/dolls/rosie/rosie-story-1.png",
    duration_ms: 6500,
  },
  {
    id: "page-2",
    text: "She felt a little unsure as a fluffy chick came close to her feet, peeping softly as if waiting for her to say hello.",
    image_url: "/images/dolls/rosie/rosie-story-2.png",
    duration_ms: 6500,
  },
  {
    id: "page-3",
    text: "Rosie knelt down and held out her hand, and the tiny chick hopped closer, followed by two more, gathering around her in a soft, happy circle.",
    image_url: "/images/dolls/rosie/rosie-story-3.png",
    duration_ms: 6500,
  },
  {
    id: "page-4",
    text: "Soon the whole farm felt calm and friendly, and Rosie smiled, feeling brave and at home among her new little friends.",
    image_url: "/images/dolls/rosie/rosie-story-4.png",
    duration_ms: 6500,
  },
];

function buildUniverse(dollRow) {
  const universeName =
    normalizeText(dollRow?.universe_name) ||
    normalizeText(dollRow?.theme_name) ||
    "Handmade World";
  const universeSlug =
    slugifySegment(normalizeText(dollRow?.universe_name) || normalizeText(dollRow?.theme_name)) ||
    "handmade-world";
  const summary =
    normalizeText(dollRow?.universe_description) ||
    normalizeText(dollRow?.theme_description) ||
    normalizeText(dollRow?.character_world) ||
    normalizeText(dollRow?.short_intro) ||
    "A soft little world full of warmth, wonder, and handmade stories.";
  const tone =
    normalizeText(dollRow?.universe_tone) ||
    (normalizeText(dollRow?.theme_name) ? "gentle" : "warm");
  const environment =
    normalizeText(dollRow?.character_world) ||
    normalizeText(dollRow?.universe_description) ||
    summary;

  return {
    id: dollRow?.universe_id || `theme:${universeSlug}`,
    slug: universeSlug,
    name: universeName,
    summary,
    tone,
    environment,
    cover_image_url: null,
  };
}

function buildDollOverlay(dollRow, storyRows) {
  const slug = normalizeText(dollRow?.slug);
  const teaser = normalizeText(
    (storyRows || []).find((row) => row?.type === "teaser")?.content
  );
  const heroImageUrl =
    slug === ROSIE_SLUG
      ? ROSIE_HERO_IMAGE_URL
      : normalizeText(dollRow?.image_url) || null;

  return {
    id: String(dollRow?.id || ""),
    slug,
    name: normalizeText(dollRow?.name) || "Handmade Doll",
    short_intro:
      normalizeText(dollRow?.short_intro) ||
      teaser ||
      "A one-of-a-kind handmade doll with a story to discover.",
    emotional_hook:
      normalizeText(dollRow?.emotional_hook) ||
      "A gentle little friend with a kind heart.",
    hero_image_url: heroImageUrl,
    audio_urls: dollRow?.audio_urls ?? null,
    personality_traits: splitTraits(dollRow?.personality_traits),
    world_variant: normalizeText(dollRow?.character_world) || null,
  };
}

function buildStoryPages(storyRows, doll) {
  if (doll?.slug === ROSIE_SLUG) {
    return ROSIE_STORY_PAGES.map((page) => ({ ...page }));
  }

  const teaser = normalizeText(
    (storyRows || []).find((row) => row?.type === "teaser")?.content
  );
  const mainStory = normalizeText(
    (storyRows || []).find((row) => row?.type === "main")?.content
  );
  const miniStories = (storyRows || [])
    .filter((row) => row?.type === "mini")
    .map((row) => normalizeText(row?.content))
    .filter(Boolean)
    .slice(0, 2);

  const pages = [
    teaser
      ? {
          id: "teaser",
          text: teaser,
          image_url: doll.hero_image_url,
          duration_ms: 3600,
        }
      : null,
    mainStory
      ? {
          id: "main",
          text: mainStory,
          image_url: doll.hero_image_url,
          duration_ms: 5600,
        }
      : null,
    ...miniStories.map((text, index) => ({
      id: `mini-${index + 1}`,
      text,
      image_url: doll.hero_image_url,
      duration_ms: 3800,
    })),
  ].filter(Boolean);

  if (pages.length > 0) {
    return pages;
  }

  return [
    {
      id: "fallback-story",
      text:
        doll.short_intro ||
        doll.emotional_hook ||
        `${doll.name} is ready to share a soft and happy story.`,
      image_url: doll.hero_image_url,
      duration_ms: 4200,
    },
  ];
}

function buildPlayActivity(universe, doll, storyPages) {
  const prompt =
    doll.emotional_hook ||
    storyPages?.[0]?.text ||
    `What would ${doll.name} like to do in ${universe.name}?`;

  return {
    type: "choice_prompt",
    prompt: `What should ${doll.name} do next?`,
    choices: [
      {
        id: "listen",
        label: "Listen",
        result_text: `${doll.name} listens closely and finds a little bit of wonder in ${universe.name}.`,
      },
      {
        id: "help",
        label: "Help",
        result_text: `${doll.name} chooses kindness and makes the world feel safer and brighter.`,
      },
      {
        id: "explore",
        label: "Explore",
        result_text: `${doll.name} follows curiosity and discovers something gentle and surprising.`,
      },
    ],
    helper_text: prompt,
  };
}

function buildRelatedCharacters(relatedDollRows, dollRow) {
  return (relatedDollRows || [])
    .filter((row) => row?.id !== dollRow?.id)
    .slice(0, 3)
    .map((row) => ({
      id: String(row?.id || ""),
      slug: normalizeText(row?.slug),
      name: normalizeText(row?.name) || "Friend",
      short_intro:
        normalizeText(row?.short_intro) ||
        normalizeText(row?.emotional_hook) ||
        "A gentle friend from the same handmade world.",
      image_url: normalizeText(row?.image_url) || null,
      relation_label:
        normalizeText(row?.theme_name) ||
        normalizeText(row?.character_world) ||
        null,
    }));
}

export function buildV1Experience({ dollRow, storyRows = [], relatedDollRows = [] }) {
  const universe = buildUniverse(dollRow);
  const doll = buildDollOverlay(dollRow, storyRows);
  const storyPages = buildStoryPages(storyRows, doll);
  const relatedCharacters = buildRelatedCharacters(relatedDollRows, dollRow);
  const playActivity = buildPlayActivity(universe, doll, storyPages);

  return {
    version: "v1",
    universe,
    doll,
    scenes: [
      {
        id: "welcome",
        type: "welcome",
        title: "Welcome",
        enabled: true,
        content: {
          welcome_line: doll.short_intro,
        },
      },
      {
        id: "story",
        type: "story",
        title: "Story",
        enabled: storyPages.length > 0,
        autoplay: true,
        story_media: {
          mode: "text_pages",
          autoplay: true,
          narration_audio_url: null,
          pages: storyPages,
        },
      },
      {
        id: "play",
        type: "play",
        title: "Play",
        enabled: Boolean(playActivity?.choices?.length),
        play_activity: playActivity,
      },
      {
        id: "meet_friends",
        type: "meet_friends",
        title: "Meet Friends",
        enabled: relatedCharacters.length > 0,
        related_characters: relatedCharacters,
      },
    ],
  };
}
