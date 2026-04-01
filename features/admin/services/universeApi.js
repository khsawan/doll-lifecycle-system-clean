import { readFailureResultMessage } from "../../../lib/shared/contracts";

const DEFAULT_UNIVERSES_ENDPOINT = "/api/admin/universes";

const buildUniverseEndpoint = (universeId) =>
  `${DEFAULT_UNIVERSES_ENDPOINT}/${encodeURIComponent(String(universeId))}`;

async function readUniverseResponseBody(response) {
  return response.json().catch(() => null);
}

export async function fetchAdminUniverses(
  fetcher,
  endpoint = DEFAULT_UNIVERSES_ENDPOINT
) {
  const response = await fetcher(endpoint, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await readUniverseResponseBody(response);

  if (!response.ok) {
    throw new Error(
      readFailureResultMessage(body, "Failed to load universes.")
    );
  }

  return Array.isArray(body?.data?.universes) ? body.data.universes : [];
}

export async function fetchAdminUniverseDetail(fetcher, universeId) {
  if (!universeId) {
    throw new Error("A universe id is required.");
  }

  const response = await fetcher(buildUniverseEndpoint(universeId), {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await readUniverseResponseBody(response);

  if (!response.ok) {
    throw new Error(
      readFailureResultMessage(body, "Failed to load universe detail.")
    );
  }

  const data = body?.data || {};

  return {
    universe: data.universe || null,
    assignedDolls: Array.isArray(data.assignedDolls) ? data.assignedDolls : [],
    unassignedDolls: Array.isArray(data.unassignedDolls) ? data.unassignedDolls : [],
  };
}
