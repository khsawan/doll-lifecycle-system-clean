function buildStoryRows(dollId, story = {}) {
  return [
    {
      doll_id: dollId,
      type: "teaser",
      title: "Card teaser",
      content: story.teaser,
      sequence_order: 1,
    },
    {
      doll_id: dollId,
      type: "main",
      title: "Main story",
      content: story.mainStory,
      sequence_order: 2,
    },
    {
      doll_id: dollId,
      type: "mini",
      title: "Mini story 1",
      content: story.mini1,
      sequence_order: 3,
    },
    {
      doll_id: dollId,
      type: "mini",
      title: "Mini story 2",
      content: story.mini2,
      sequence_order: 4,
    },
  ].filter((row) => (row.content || "").trim());
}

export async function saveAdminStory(client, dollId, story = {}) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const rows = buildStoryRows(dollId, story);

  const deleteResult = await client.from("stories").delete().eq("doll_id", dollId);
  if (deleteResult?.error) {
    throw deleteResult.error;
  }

  if (rows.length > 0) {
    const insertResult = await client.from("stories").insert(rows);
    if (insertResult?.error) {
      throw insertResult.error;
    }
  }

  const dollPatch = { status: "story" };
  const updateResult = await client.from("dolls").update(dollPatch).eq("id", dollId);
  if (updateResult?.error) {
    throw updateResult.error;
  }

  return {
    rows,
    dollPatch,
  };
}
