import { createClient } from "@supabase/supabase-js";

export function resolveAdminStoreConfig(env = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  };
}

export function createAdminStoreClient(env = process.env) {
  const config = resolveAdminStoreConfig(env);

  if (!config.isConfigured) {
    return null;
  }

  return createClient(config.url, config.key);
}
