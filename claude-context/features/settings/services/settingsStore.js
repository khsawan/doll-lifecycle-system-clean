import {
  createAdminStoreClient,
  resolveAdminStoreConfig,
} from "../../admin/services/store.js";
import { normalizeSettingValue, SETTINGS_KEYS } from "../domain/settings.js";

export function resolveSettingsSupabaseConfig(env = process.env) {
  return resolveAdminStoreConfig(env);
}

export function createSettingsStoreClient(env = process.env) {
  return createAdminStoreClient(env);
}

export async function fetchSettingsRecords(client, keys = SETTINGS_KEYS) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  const { data, error } = await client
    .from("app_settings")
    .select("key, value")
    .in("key", keys);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function buildSettingsValueMap(rows, keys = SETTINGS_KEYS) {
  const allowedKeys = new Set(keys);

  return (rows || []).reduce((acc, row) => {
    if (!allowedKeys.has(row?.key)) {
      return acc;
    }

    acc[row.key] = normalizeSettingValue(row.value);
    return acc;
  }, {});
}

export async function fetchSettingsValueMap(client, keys = SETTINGS_KEYS) {
  const rows = await fetchSettingsRecords(client, keys);
  return buildSettingsValueMap(rows, keys);
}

export async function persistSettingsRecords(client, rows) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  const { error } = await client
    .from("app_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    throw new Error(error.message);
  }

  return rows;
}
