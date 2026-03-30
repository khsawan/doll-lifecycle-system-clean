import { DEFAULT_THEMES } from "../constants/content";

const DEFAULT_CATALOG_ENDPOINT = "/api/admin/catalog";

function resolveCatalogErrorMessage(body, fallbackMessage) {
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error.trim();
  }

  return fallbackMessage;
}

async function readCatalogResponseBody(response) {
  return response.json().catch(() => null);
}

export async function fetchAdminCatalog(
  fetcher,
  endpoint = DEFAULT_CATALOG_ENDPOINT
) {
  const response = await fetcher(endpoint, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await readCatalogResponseBody(response);

  if (!response.ok) {
    throw new Error(
      resolveCatalogErrorMessage(body, "Failed to load catalog.")
    );
  }

  return {
    themes: Array.isArray(body?.themes) ? body.themes : DEFAULT_THEMES,
    dolls: Array.isArray(body?.dolls) ? body.dolls : [],
  };
}

export async function createAdminCatalogDoll(
  fetcher,
  payload,
  endpoint = DEFAULT_CATALOG_ENDPOINT
) {
  const response = await fetcher(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await readCatalogResponseBody(response);

  if (!response.ok) {
    throw new Error(
      resolveCatalogErrorMessage(body, "Failed to create doll.")
    );
  }

  return body?.doll || null;
}
