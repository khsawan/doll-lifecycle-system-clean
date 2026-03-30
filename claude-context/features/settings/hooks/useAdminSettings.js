"use client";

import { useEffect, useState } from "react";
import {
  buildSettingsSectionRows,
  buildSettingsState,
  EMPTY_SETTINGS,
  isSettingsSectionDirty,
  isSettingsSectionSaved,
  mergePersistedSettingsKeys,
} from "../domain/settings";
import {
  fetchAdminSettings,
  saveAdminSettingsSection,
} from "../services/settingsApi";

export function useAdminSettings({
  isEnabled,
  fetcher = typeof fetch === "undefined" ? null : fetch,
} = {}) {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(EMPTY_SETTINGS);
  const [persistedKeys, setPersistedKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (!fetcher) {
      setError("Could not load settings.");
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const rows = await fetchAdminSettings(fetcher);

        if (isCancelled) {
          return;
        }

        const nextState = buildSettingsState(rows);
        setSettings(nextState.settings);
        setSavedSettings(nextState.settings);
        setPersistedKeys(nextState.persistedKeys);
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load settings."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isCancelled = true;
    };
  }, [fetcher, isEnabled]);

  function updateSetting(key, value) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
    setNotice("");
  }

  async function saveSection(section) {
    if (!fetcher) {
      setError("Could not save settings.");
      return;
    }

    const rows = buildSettingsSectionRows(section, settings);
    const nextValues = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    setSavingSection(section.id);
    setError("");
    setNotice("");

    try {
      await saveAdminSettingsSection(fetcher, rows);
      setSavedSettings((currentSavedSettings) => ({
        ...currentSavedSettings,
        ...nextValues,
      }));
      setPersistedKeys((currentPersistedKeys) =>
        mergePersistedSettingsKeys(currentPersistedKeys, section.keys)
      );
      setNotice(`${section.title} saved.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save settings."
      );
    } finally {
      setSavingSection("");
    }
  }

  return {
    settings,
    loading,
    savingSection,
    notice,
    error,
    updateSetting,
    saveSection,
    isSectionDirty: (section) =>
      isSettingsSectionDirty(section, settings, savedSettings),
    isSectionSaved: (section) =>
      isSettingsSectionSaved(section, persistedKeys),
  };
}
