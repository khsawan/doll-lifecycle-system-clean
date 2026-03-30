function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeResultData(result) {
  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.rows)) {
    return result.rows;
  }

  if (Array.isArray(result?.data?.rows)) {
    return result.data.rows;
  }

  return [];
}

function normalizeSingleResultData(result) {
  if (isPlainObject(result?.data?.data)) {
    return result.data.data;
  }

  if (isPlainObject(result?.data)) {
    return result.data;
  }

  if (isPlainObject(result?.row)) {
    return result.row;
  }

  return null;
}

function readResultErrorMessage(result) {
  if (typeof result?.error === "string" && result.error.trim()) {
    return result.error.trim();
  }

  if (typeof result?.error?.message === "string" && result.error.message.trim()) {
    return result.error.message.trim();
  }

  if (typeof result?.message === "string" && result.message.trim()) {
    return result.message.trim();
  }

  return "";
}

async function fetchRelatedDollRows(client, dollRow) {
  if (dollRow?.universe_id) {
    const universeResult = await client
      .from("dolls")
      .select("id, slug, name, short_intro, emotional_hook, image_url, theme_name, universe_id")
      .eq("universe_id", dollRow.universe_id)
      .neq("id", dollRow.id)
      .limit(3);

    const universeRows = normalizeResultData(universeResult);
    if (universeRows.length > 0) {
      return universeRows;
    }
  }

  if (dollRow?.theme_name) {
    const themeResult = await client
      .from("dolls")
      .select("id, slug, name, short_intro, emotional_hook, image_url, theme_name")
      .eq("theme_name", dollRow.theme_name)
      .neq("id", dollRow.id)
      .limit(3);

    return normalizeResultData(themeResult);
  }

  return [];
}

export async function fetchPublicExperienceData(client, slug) {
  if (!client) {
    throw new Error("This doll page is not configured yet.");
  }

  const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
  if (!normalizedSlug) {
    throw new Error("This doll page could not be found.");
  }

  const dollResult = await client
    .from("dolls")
    .select("*")
    .eq("slug", normalizedSlug)
    .single();
  const dollRow = normalizeSingleResultData(dollResult);
  const dollError = readResultErrorMessage(dollResult);

  if (dollError || !dollRow) {
    throw new Error("This doll page could not be found.");
  }

  const storyResult = await client
    .from("stories")
    .select("*")
    .eq("doll_id", dollRow.id)
    .order("sequence_order", { ascending: true });

  const relatedDollRows = await fetchRelatedDollRows(client, dollRow);

  return {
    dollRow,
    storyRows: normalizeResultData(storyResult),
    relatedDollRows,
  };
}
