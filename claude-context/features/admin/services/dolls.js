import { withNormalizedPipelineState } from "../../../lib/pipelineState";
import { updateDollImageUrl } from "../../../lib/assets/infrastructure/dolls";
import {
  buildDollImageAssetPath,
  uploadAssetFile,
} from "../../../lib/assets/infrastructure/storage";
import {
  getPipelineNormalizationTimestamp,
  isMissingPipelineStateColumnError,
} from "../domain/workflow";

export function normalizeAdminDollRecord(record = {}) {
  return withNormalizedPipelineState(
    {
      ...record,
      theme_name: record.theme_name || "Unassigned",
    },
    { timestamp: getPipelineNormalizationTimestamp(record) }
  );
}

export async function fetchAdminDolls(client) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  const { data, error } = await client
    .from("dolls")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((record) => normalizeAdminDollRecord(record));
}

export async function fetchAdminDollDetailResources(client, dollId) {
  if (!client || !dollId) {
    return {
      stories: [],
      contentRows: [],
      orders: [],
    };
  }

  const [storiesResult, contentRowsResult, ordersResult] = await Promise.all([
    client
      .from("stories")
      .select("*")
      .eq("doll_id", dollId)
      .order("sequence_order", { ascending: true }),
    client.from("content_assets").select("*").eq("doll_id", dollId),
    client.from("orders").select("*").eq("doll_id", dollId).limit(1),
  ]);

  return {
    stories: storiesResult?.error ? [] : storiesResult?.data || [],
    contentRows: contentRowsResult?.error ? [] : contentRowsResult?.data || [],
    orders: ordersResult?.error ? [] : ordersResult?.data || [],
  };
}

export async function persistAdminDollPatch(client, dollId, patch = {}) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const { error } = await client.from("dolls").update(patch).eq("id", dollId);

  if (error) {
    throw error;
  }

  return patch;
}

export async function createAdminDoll(
  client,
  { basePayload = {}, defaultPipelineState = null, pipelineTimestamp = null } = {}
) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  let insertResult = await client
    .from("dolls")
    .insert({
      ...basePayload,
      pipeline_state: defaultPipelineState,
    })
    .select()
    .single();

  if (insertResult.error && isMissingPipelineStateColumnError(insertResult.error)) {
    insertResult = await client.from("dolls").insert(basePayload).select().single();
  }

  const { data, error } = insertResult;

  if (error) {
    throw error;
  }

  return withNormalizedPipelineState(
    {
      ...data,
      theme_name: data?.theme_name || "Unassigned",
    },
    {
      timestamp: pipelineTimestamp || getPipelineNormalizationTimestamp(data),
    }
  );
}

export async function persistAdminPipelineState(client, dollId, pipelineState) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const { error } = await client
    .from("dolls")
    .update({ pipeline_state: pipelineState })
    .eq("id", dollId);

  if (error) {
    if (isMissingPipelineStateColumnError(error)) {
      return {
        persisted: false,
        pipelineState,
      };
    }

    throw error;
  }

  return {
    persisted: true,
    pipelineState,
  };
}

export async function uploadAdminDollImage(
  client,
  { dollId, file, now = Date.now } = {}
) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  if (!file) {
    throw new Error("An image file is required.");
  }

  const filePath = buildDollImageAssetPath({
    dollId,
    fileName: file.name,
    now,
  });
  const uploadResult = await uploadAssetFile(client, {
    filePath,
    file,
    upsert: true,
  });
  const publicImageUrl = uploadResult.publicUrl || "";

  await updateDollImageUrl(client, dollId, publicImageUrl);

  return {
    filePath,
    publicImageUrl,
  };
}

export async function deleteAdminDollPermanently(
  client,
  { dollId, storagePaths = [] } = {}
) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const uniqueStoragePaths = Array.from(new Set(storagePaths.filter(Boolean)));

  if (uniqueStoragePaths.length) {
    const { error: storageError } = await client.storage
      .from("doll-assets")
      .remove(uniqueStoragePaths);

    if (storageError) {
      throw new Error(`Could not remove stored QR or image files. ${storageError.message}`);
    }
  }

  const { error: storiesError } = await client.from("stories").delete().eq("doll_id", dollId);
  if (storiesError) {
    throw storiesError;
  }

  const { error: contentError } = await client
    .from("content_assets")
    .delete()
    .eq("doll_id", dollId);
  if (contentError) {
    throw contentError;
  }

  const { error: ordersError } = await client.from("orders").delete().eq("doll_id", dollId);
  if (ordersError) {
    throw ordersError;
  }

  const { error: dollError } = await client.from("dolls").delete().eq("id", dollId);
  if (dollError) {
    throw dollError;
  }

  return {
    deletedId: dollId,
    storagePaths: uniqueStoragePaths,
  };
}
