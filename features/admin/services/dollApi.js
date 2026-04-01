import {
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

export async function saveAdminDollPatchViaApi(fetcher, dollId, patch) {
  if (!fetcher) {
    throw new Error("Could not save doll changes.");
  }

  const response = await fetcher(`/api/admin/dolls/${encodeURIComponent(dollId)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      patch,
    }),
  });
  const body = await response.json().catch(() => ({}));
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(readFailureResultMessage(body, "Could not save doll changes."));
  }

  return {
    dollPatch:
      data?.dollPatch && typeof data.dollPatch === "object" && !Array.isArray(data.dollPatch)
        ? data.dollPatch
        : patch,
  };
}

export async function saveAdminDollUniverseAssignmentViaApi(fetcher, dollId, universeId) {
  return saveAdminDollPatchViaApi(fetcher, dollId, {
    universe_id: universeId || null,
  });
}

export async function deleteAdminDollPermanentlyViaApi(
  fetcher,
  dollId,
  { storagePaths = [] } = {}
) {
  if (!fetcher) {
    throw new Error("Could not delete doll.");
  }

  const response = await fetcher(`/api/admin/dolls/${encodeURIComponent(dollId)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      storagePaths,
    }),
  });
  const body = await response.json().catch(() => ({}));
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(readFailureResultMessage(body, "Could not delete doll."));
  }

  return {
    deletedId: data?.deletedId || dollId,
    storagePaths: Array.isArray(data?.storagePaths) ? data.storagePaths : storagePaths,
  };
}
