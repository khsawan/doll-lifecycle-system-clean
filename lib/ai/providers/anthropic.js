import "server-only";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-latest";

function extractTextContent(data) {
  if (!Array.isArray(data?.content)) return "";

  return data.content
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function readPromptField(prompt, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(prompt || "").match(new RegExp(`^- ${escapedLabel}:\\s*(.*)$`, "mi"));
  const value = match?.[1]?.trim() || "";

  return value === "Not provided" ? "" : value;
}

function readPromptFieldWithFallback(prompt, labels) {
  const normalizedLabels = Array.isArray(labels) ? labels : [labels];

  for (const label of normalizedLabels) {
    const value = readPromptField(prompt, label);

    if (value) {
      return value;
    }
  }

  return "";
}

function buildAppearanceSentence(name, expressionFeel, notableFeatures) {
  if (expressionFeel && notableFeatures) {
    return `With a ${expressionFeel} and ${notableFeatures}, ${name} made new friends feel welcome right away.`;
  }

  if (expressionFeel) {
    return `With a ${expressionFeel}, ${name} made new friends feel welcome right away.`;
  }

  if (notableFeatures) {
    return `${name} was easy to spot because of ${notableFeatures}, and that familiar sight always made someone smile.`;
  }

  return `${name} had a gentle way of making everyone feel safe and welcome.`;
}

function buildMockStoryResponse(prompt) {
  const name = readPromptField(prompt, "Name") || "This doll";
  const rawTheme = readPromptField(prompt, "Theme");
  const theme = rawTheme && rawTheme.toLowerCase() !== "unassigned" ? rawTheme : "";
  const universeName = readPromptField(prompt, "Universe name");
  const characterWorld = readPromptFieldWithFallback(prompt, ["World", "Character world"]);
  const universeEnvironment = readPromptFieldWithFallback(prompt, ["Environment", "Universe environment"]);
  const expressionFeel = readPromptFieldWithFallback(prompt, ["Expression", "Expression feel"]);
  const notableFeatures = readPromptFieldWithFallback(prompt, ["Features", "Notable features"]);
  const setting =
    characterWorld ||
    universeEnvironment ||
    (theme ? `the ${theme} world` : universeName || "a quiet little world full of kindness");

  const storyMain = [
    `${name} loved spending time in ${setting}, where every day felt soft, bright, and full of little wonders.`,
    buildAppearanceSentence(name, expressionFeel, notableFeatures),
    `${name} always made that corner of the world feel a little gentler, and by evening everyone who met ${name} carried home a small spark of comfort and joy.`,
  ].join(" ");

  return JSON.stringify({ story_main: storyMain });
}

function buildMockContentPackResponse(prompt) {
  const name = readPromptField(prompt, "Name") || "This doll";
  const rawTheme = readPromptField(prompt, "Theme");
  const theme = rawTheme && rawTheme.toLowerCase() !== "unassigned" ? rawTheme : "";
  const emotionalHook = readPromptField(prompt, "Emotional hook");
  const universeName = readPromptField(prompt, "Universe name");
  const characterWorld = readPromptFieldWithFallback(prompt, ["World", "Character world"]);
  const universeEnvironment = readPromptFieldWithFallback(prompt, ["Environment", "Universe environment"]);
  const setting =
    characterWorld ||
    universeEnvironment ||
    (theme ? `the ${theme} world` : universeName || "a warm little world full of wonder");
  const heartline = emotionalHook || `${name} brings comfort, imagination, and joy to everyday moments`;

  return JSON.stringify({
    short_intro: `${name} is a handmade friend from ${setting}, ready to bring a little more warmth and wonder to the day.`,
    content_blurb: `${name} is created to feel gentle, comforting, and full of character. With a story rooted in ${setting}, ${name} reminds little ones that ${heartline.charAt(0).toLowerCase() + heartline.slice(1)}.`,
    promo_hook: "A soft-hearted companion who brings storybook warmth to every moment.",
    cta: `Bring ${name} home and let the story begin.`,
  });
}

function buildMockSocialResponse(prompt) {
  const name = readPromptField(prompt, "Name") || "This doll";
  const rawTheme = readPromptField(prompt, "Theme");
  const theme = rawTheme && rawTheme.toLowerCase() !== "unassigned" ? rawTheme : "";
  const emotionalHook = readPromptField(prompt, "Emotional hook");
  const universeName = readPromptField(prompt, "Universe name");
  const characterWorld = readPromptFieldWithFallback(prompt, ["World", "Character world"]);
  const universeEnvironment = readPromptFieldWithFallback(prompt, ["Environment", "Universe environment"]);
  const setting =
    characterWorld ||
    universeEnvironment ||
    (theme ? `the ${theme} world` : universeName || "a warm little storybook world");
  const heartline = emotionalHook || `${name} brings comfort and joy wherever the story goes`;

  return JSON.stringify({
    social_hook: `Meet ${name}, a little friend full of warmth and wonder.`,
    social_caption: `${name} brings the softness of ${setting} into everyday moments. Thoughtfully handmade and full of heart, ${name} reminds us that ${heartline.charAt(0).toLowerCase() + heartline.slice(1)}.`,
    social_cta: `Discover ${name}'s story.`,
  });
}

function buildMockV1ContentResponse(prompt) {
  const name = readPromptField(prompt, "Name") || "This doll";
  const rawTheme = readPromptField(prompt, "Theme");
  const theme = rawTheme && rawTheme.toLowerCase() !== "unassigned" ? rawTheme : "";
  const universeName = readPromptField(prompt, "Universe name");
  const characterWorld = readPromptFieldWithFallback(prompt, ["World", "Character world"]);
  const universeEnvironment = readPromptFieldWithFallback(prompt, ["Environment", "Universe environment"]);
  const emotionalHook = readPromptField(prompt, "Emotional hook");
  const setting =
    characterWorld ||
    universeEnvironment ||
    (theme ? `the ${theme} world` : universeName || "a gentle little world");
  const comfortLine = emotionalHook || `${name} helps every moment feel a little softer and safer`;

  return JSON.stringify({
    intro_script: `Hello, I am ${name}. Welcome to ${setting}. I am so happy you are here with me.`,
    story_pages: [
      `${name} stepped into ${setting}, where everything felt calm, bright, and ready for a gentle adventure together.`,
      `A soft little moment appeared, and ${name} noticed how ${comfortLine.charAt(0).toLowerCase() + comfortLine.slice(1)}.`,
      `${name} chose one kind thing to do, and that choice made the whole world feel warmer and more welcoming.`,
      `By the end, ${name} and the child felt safe, close, and ready to carry that warm feeling into the rest of the day.`,
    ],
    play_activity: {
      prompt: `What should ${name} do next?`,
      choices: [
        {
          id: "choice_1",
          label: "Hold a soft blanket",
          result_text: `${name} holds a soft blanket and the moment feels extra cozy and calm.`,
        },
        {
          id: "choice_2",
          label: "Twirl in a circle",
          result_text: `${name} twirls in a little circle and the whole scene feels lighter and brighter.`,
        },
        {
          id: "choice_3",
          label: "Wave to a new friend",
          result_text: `${name} waves to a new friend, and ${setting} feels even kinder than before.`,
        },
      ],
    },
  });
}

export async function generateWithAnthropic({ prompt, task = "story", model = "" }) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const resolvedModel = typeof model === "string" && model.trim() ? model.trim() : DEFAULT_MODEL;

  if (!apiKey) {
    console.warn("Using mock AI generation (no API key provided)");
    if (task === "content_pack") return buildMockContentPackResponse(prompt);
    if (task === "social") return buildMockSocialResponse(prompt);
    if (task === "v1_content") return buildMockV1ContentResponse(prompt);
    return buildMockStoryResponse(prompt);
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: resolvedModel,
      max_tokens: 900,
      temperature: 0.6,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    let details = "";

    try {
      details = (await response.text()).trim();
    } catch {
      details = "";
    }

    const suffix = details ? ` ${details.slice(0, 500)}` : "";
    throw new Error(`Anthropic request failed with status ${response.status}.${suffix}`);
  }

  const data = await response.json();
  const text = extractTextContent(data);

  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return text;
}
