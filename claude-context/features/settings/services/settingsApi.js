const DEFAULT_SETTINGS_ENDPOINT = "/api/admin/settings";

function resolveSettingsErrorMessage(body, fallbackMessage) {
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error.trim();
  }

  return fallbackMessage;
}

async function readSettingsResponseBody(response) {
  return response.json().catch(() => null);
}

export async function fetchAdminSettings(
  fetcher,
  endpoint = DEFAULT_SETTINGS_ENDPOINT
) {
  const response = await fetcher(endpoint, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await readSettingsResponseBody(response);

  if (!response.ok) {
    throw new Error(
      resolveSettingsErrorMessage(body, "Failed to load settings.")
    );
  }

  return Array.isArray(body?.settings) ? body.settings : [];
}

export async function saveAdminSettingsSection(
  fetcher,
  rows,
  endpoint = DEFAULT_SETTINGS_ENDPOINT
) {
  const response = await fetcher(endpoint, {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      settings: rows,
    }),
  });
  const body = await readSettingsResponseBody(response);

  if (!response.ok) {
    throw new Error(
      resolveSettingsErrorMessage(body, "Failed to save settings.")
    );
  }

  return Array.isArray(body?.settings) ? body.settings : [];
}
