import {
  createSettingsStoreClient,
  fetchSettingsValueMap,
} from "../../../features/settings/services/settingsStore.js";
import { AI_SETTING_KEYS } from "../domain/taskRouting.js";

export async function loadAISettings(settingKeys = AI_SETTING_KEYS) {
  const client = createSettingsStoreClient();

  if (!client) {
    return {};
  }

  try {
    return await fetchSettingsValueMap(client, [...settingKeys]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`Unable to load AI settings. ${message}`);
    return {};
  }
}
