function buildContentAssetRows(dollId, contentPack = {}) {
  return [
    {
      doll_id: dollId,
      type: "instagram_caption",
      title: "Instagram Caption",
      content: contentPack.caption,
      platform: "instagram",
      status: "draft",
    },
    {
      doll_id: dollId,
      type: "promo_hook",
      title: "Promo Hook",
      content: contentPack.hook,
      platform: "internal",
      status: "draft",
    },
    {
      doll_id: dollId,
      type: "product_blurb",
      title: "Product Blurb",
      content: contentPack.blurb,
      platform: "internal",
      status: "draft",
    },
    {
      doll_id: dollId,
      type: "cta",
      title: "CTA",
      content: contentPack.cta,
      platform: "internal",
      status: "draft",
    },
  ].filter((row) => (row.content || "").trim());
}

export async function saveAdminContentPack(client, dollId, contentPack = {}) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const rows = buildContentAssetRows(dollId, contentPack);
  const deleteResult = await client
    .from("content_assets")
    .delete()
    .eq("doll_id", dollId)
    .in("type", ["instagram_caption", "promo_hook", "product_blurb", "cta"]);

  if (deleteResult?.error) {
    throw deleteResult.error;
  }

  if (rows.length > 0) {
    const insertResult = await client.from("content_assets").insert(rows);
    if (insertResult?.error) {
      throw insertResult.error;
    }
  }

  const dollPatch = { status: "content" };
  const updateResult = await client.from("dolls").update(dollPatch).eq("id", dollId);
  if (updateResult?.error) {
    throw updateResult.error;
  }

  return {
    rows,
    dollPatch,
  };
}
