"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminUniverses } from "../services/universeApi";

const UNIVERSES_ENDPOINT = "/api/admin/universes";

function buildUniverseEndpoint(id) {
  return `${UNIVERSES_ENDPOINT}/${encodeURIComponent(String(id))}`;
}

async function createAdminUniverse(fetcher, payload) {
  const response = await fetcher(UNIVERSES_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string" ? body.error : "Failed to create universe."
    );
  }

  return body?.data?.universe || null;
}

async function updateAdminUniverse(fetcher, id, patch) {
  const response = await fetcher(buildUniverseEndpoint(id), {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string" ? body.error : "Failed to update universe."
    );
  }

  return body?.data?.universe || null;
}

const EMPTY_CREATE_DRAFT = {
  name: "",
  slug: "",
  description: "",
  emotional_core: "",
};

export function useAdminUniverses({
  isEnabled,
  fetcher = typeof fetch === "undefined" ? null : fetch,
} = {}) {
  const [universes, setUniverses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const [isCreating, setIsCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState(EMPTY_CREATE_DRAFT);

  const loadUniverses = useCallback(
    async function () {
      if (!fetcher) {
        setError("Could not load universes.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchAdminUniverses(fetcher);
        setUniverses(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load universes."
        );
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    void loadUniverses();
  }, [isEnabled, loadUniverses]);

  function openEdit(universe) {
    setEditingId(universe.id);
    setEditDraft({
      name: universe.name || "",
      description: universe.description || "",
      emotional_core: universe.emotional_core || "",
    });
    setNotice("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  function updateEditDraft(key, value) {
    setEditDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function saveEdit(universeId) {
    if (!fetcher || !universeId) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const updated = await updateAdminUniverse(fetcher, universeId, editDraft);
      setUniverses((current) =>
        current.map((u) => (u.id === universeId ? { ...u, ...updated } : u))
      );
      setEditingId(null);
      setEditDraft({});
      setNotice("Universe saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save universe."
      );
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setIsCreating(true);
    setCreateDraft(EMPTY_CREATE_DRAFT);
    setNotice("");
    setError("");
  }

  function cancelCreate() {
    setIsCreating(false);
    setCreateDraft(EMPTY_CREATE_DRAFT);
  }

  function updateCreateDraft(key, value) {
    setCreateDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function saveCreate() {
    if (!fetcher) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const created = await createAdminUniverse(fetcher, createDraft);
      setUniverses((current) => [
        ...current,
        { ...created, doll_count: 0 },
      ]);
      setIsCreating(false);
      setCreateDraft(EMPTY_CREATE_DRAFT);
      setNotice("Universe created.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create universe."
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    universes,
    loading,
    saving,
    notice,
    error,
    editingId,
    editDraft,
    isCreating,
    createDraft,
    openEdit,
    cancelEdit,
    updateEditDraft,
    saveEdit,
    openCreate,
    cancelCreate,
    updateCreateDraft,
    saveCreate,
  };
}
