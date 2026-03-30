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

function buildRosieFixture() {
  return {
    slug: ROSIE_SLUG,
    doll: {
      hero_image_url: ROSIE_HERO_IMAGE_URL,
    },
    story_pages: ROSIE_STORY_PAGES.map((page) => ({ ...page })),
  };
}

export function getPublicExperienceFixture(slug) {
  const normalizedSlug =
    typeof slug === "string" ? slug.trim().toLowerCase() : "";

  if (normalizedSlug !== ROSIE_SLUG) {
    return null;
  }

  return buildRosieFixture();
}
