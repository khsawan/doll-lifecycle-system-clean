const STORY_TYPE_MAP = [
  { key: "teaser",    storyType: "teaser", title: "Card teaser"  },
  { key: "mainStory", storyType: "main",   title: "Main story"   },
  { key: "mini1",     storyType: "mini_1", title: "Mini story 1" },
  { key: "mini2",     storyType: "mini_2", title: "Mini story 2" },
];

function buildStoryRows(story = {}, universeId) {
  return STORY_TYPE_MAP
    .map(({ key, storyType, title }) => {
      const text = (story[key] || "").trim();
      if (!text) return null;
      return {
        story_type: storyType,
        title,
        content: { text },
        status: "published",
        universe_id: universeId || null,
      };
    })
    .filter(Boolean);
}

export async function saveAdminStory(client, dollId, story = {}) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  // Fetch doll's universe_id for the new stories records
  const { data: doll, error: dollError } = await client
    .from("dolls")
    .select("universe_id")
    .eq("id", dollId)
    .single();
  if (dollError) {
    throw dollError;
  }
  const universeId = doll?.universe_id || null;

  // Read existing linked story IDs before clearing them
  const { data: existingJunction, error: junctionReadError } = await client
    .from("doll_stories")
    .select("story_id")
    .eq("doll_id", dollId);
  if (junctionReadError) {
    throw junctionReadError;
  }
  const existingStoryIds = (existingJunction || []).map((r) => r.story_id).filter(Boolean);

  // Remove junction rows for this doll
  const { error: junctionDeleteError } = await client
    .from("doll_stories")
    .delete()
    .eq("doll_id", dollId);
  if (junctionDeleteError) {
    throw junctionDeleteError;
  }

  // Remove the now-orphaned story records
  if (existingStoryIds.length > 0) {
    const { error: storiesDeleteError } = await client
      .from("stories")
      .delete()
      .in("id", existingStoryIds);
    if (storiesDeleteError) {
      throw storiesDeleteError;
    }
  }

  const rows = buildStoryRows(story, universeId);
  let insertedStories = [];

  if (rows.length > 0) {
    const { data: inserted, error: insertError } = await client
      .from("stories")
      .insert(rows)
      .select("id, story_type");
    if (insertError) {
      throw insertError;
    }
    insertedStories = inserted || [];
  }

  // Link new story records to this doll via the junction table
  if (insertedStories.length > 0) {
    const junctionRows = insertedStories.map((s) => ({
      doll_id: dollId,
      story_id: s.id,
    }));
    const { error: junctionInsertError } = await client
      .from("doll_stories")
      .insert(junctionRows);
    if (junctionInsertError) {
      throw junctionInsertError;
    }
  }

  const dollPatch = { status: "story" };
  const { error: updateError } = await client
    .from("dolls")
    .update(dollPatch)
    .eq("id", dollId);
  if (updateError) {
    throw updateError;
  }

  return {
    rows: insertedStories,
    dollPatch,
  };
}
