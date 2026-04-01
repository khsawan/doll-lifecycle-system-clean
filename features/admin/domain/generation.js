function readTrimmedString(value, fallback = "") {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

export function buildAdminAIGenerationPayload({
  selected,
  identity = {},
  tone = "Gentle",
} = {}) {
  const liveThemeName = readTrimmedString(identity.theme_name, selected?.theme_name || "");
  const resolvedUniverseId =
    readTrimmedString(identity.universe_id) || readTrimmedString(selected?.universe_id);
  const universe =
    selected?.universe && typeof selected.universe === "object"
      ? // Priority 1: full universe object already resolved — use it directly
        selected.universe
      : resolvedUniverseId
      ? // Priority 2: universe_id present but not yet resolved — pass id for generation layer
        { universe_id: resolvedUniverseId }
      : // Priority 3: no universe_id — fall back to theme and doll fields
        {
          name:
            readTrimmedString(selected?.universe_name) ||
            (liveThemeName && liveThemeName !== "Unassigned" ? liveThemeName : ""),
          description:
            readTrimmedString(selected?.universe_description) ||
            readTrimmedString(selected?.theme_description) ||
            readTrimmedString(identity.short_intro) ||
            readTrimmedString(selected?.short_intro),
          tone,
          environment_description:
            readTrimmedString(identity.character_world) ||
            readTrimmedString(selected?.character_world),
        };

  return {
    name: readTrimmedString(identity.name, selected?.name || ""),
    theme_name: liveThemeName || "Unassigned",
    personality_traits: readTrimmedString(
      identity.personality_traits,
      selected?.personality_traits || ""
    ),
    emotional_hook: readTrimmedString(identity.emotional_hook, selected?.emotional_hook || ""),
    expression_feel: readTrimmedString(
      identity.expression_feel,
      selected?.expression_feel || ""
    ),
    character_world: readTrimmedString(
      identity.character_world,
      selected?.character_world || ""
    ),
    color_palette: readTrimmedString(identity.color_palette, selected?.color_palette || ""),
    notable_features: readTrimmedString(
      identity.notable_features,
      selected?.notable_features || ""
    ),
    universe,
  };
}

export function buildAdminManagedContentGenerationPayload({
  selected,
  identity = {},
} = {}) {
  const basePayload = buildAdminAIGenerationPayload({
    selected,
    identity,
    tone: "Gentle",
  });
  const themeName =
    typeof basePayload.theme_name === "string" ? basePayload.theme_name.trim() : "";
  const world =
    basePayload.character_world?.trim() ||
    (themeName && themeName.toLowerCase() !== "unassigned" ? themeName : "") ||
    "a gentle little world";
  const mood =
    basePayload.expression_feel?.trim() ||
    basePayload.emotional_hook?.trim() ||
    "calm";

  return {
    ...basePayload,
    personality: basePayload.personality_traits || "",
    world,
    mood,
  };
}
