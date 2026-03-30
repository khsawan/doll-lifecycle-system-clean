import {
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

const buildAdminDollBaseEndpoint = (dollId) =>
  `/api/admin/dolls/${encodeURIComponent(String(dollId))}`;
const buildAdminDollDetailEndpoint = (dollId) =>
  `${buildAdminDollBaseEndpoint(dollId)}/detail`;
const buildAdminDollStoryEndpoint = (dollId) =>
  `${buildAdminDollBaseEndpoint(dollId)}/story`;
const buildAdminDollContentPackEndpoint = (dollId) =>
  `${buildAdminDollBaseEndpoint(dollId)}/content-pack`;
const buildAdminDollOrderEndpoint = (dollId) =>
  `${buildAdminDollBaseEndpoint(dollId)}/order`;

function resolveDetailErrorMessage(body, fallbackMessage) {
  return readFailureResultMessage(body, fallbackMessage);
}

async function readDetailResponseBody(response) {
  return response.json().catch(() => null);
}

export async function fetchAdminDollDetailResources(
  fetcher,
  dollId
) {
  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const response = await fetcher(buildAdminDollDetailEndpoint(dollId), {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await readDetailResponseBody(response);
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(
      resolveDetailErrorMessage(body, "Failed to load doll details.")
    );
  }

  return {
    stories: Array.isArray(data?.stories) ? data.stories : [],
    contentRows: Array.isArray(data?.contentRows) ? data.contentRows : [],
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

export async function saveAdminStoryViaApi(fetcher, dollId, story) {
  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const response = await fetcher(buildAdminDollStoryEndpoint(dollId), {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ story }),
  });
  const body = await readDetailResponseBody(response);
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(
      resolveDetailErrorMessage(body, "Failed to save story.")
    );
  }

  return {
    rows: Array.isArray(data?.rows) ? data.rows : [],
    dollPatch:
      data?.dollPatch && typeof data.dollPatch === "object" ? data.dollPatch : null,
  };
}

export async function saveAdminContentPackViaApi(fetcher, dollId, contentPack) {
  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const response = await fetcher(buildAdminDollContentPackEndpoint(dollId), {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ contentPack }),
  });
  const body = await readDetailResponseBody(response);
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(
      resolveDetailErrorMessage(body, "Failed to save content pack.")
    );
  }

  return {
    rows: Array.isArray(data?.rows) ? data.rows : [],
    dollPatch:
      data?.dollPatch && typeof data.dollPatch === "object" ? data.dollPatch : null,
  };
}

export async function saveAdminOrderViaApi(
  fetcher,
  dollId,
  order,
  options = {}
) {
  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const response = await fetcher(buildAdminDollOrderEndpoint(dollId), {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      order,
      options,
    }),
  });
  const body = await readDetailResponseBody(response);
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(
      resolveDetailErrorMessage(body, "Failed to save order.")
    );
  }

  return {
    orderRow:
      data?.orderRow && typeof data.orderRow === "object" ? data.orderRow : null,
    dollPatch:
      data?.dollPatch && typeof data.dollPatch === "object" ? data.dollPatch : null,
  };
}
