import { DEFAULT_THEMES } from "../constants/content";

export async function fetchThemeOptions(client, fallbackThemes = DEFAULT_THEMES) {
  if (!client) {
    return fallbackThemes;
  }

  const { data } = await client.from("themes").select("name").order("name");
  const dbThemes = (data || []).map((row) => row.name).filter(Boolean);

  return Array.from(new Set(["Unassigned", ...dbThemes, ...fallbackThemes]));
}
