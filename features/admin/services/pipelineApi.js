import {
  readFailureResultMessage,
  readSuccessResultData,
} from "../../../lib/shared/contracts";

export async function saveAdminPipelineStateViaApi(fetcher, dollId, pipelineState) {
  if (!fetcher) {
    throw new Error("Could not update pipeline stage.");
  }

  const response = await fetcher(
    `/api/admin/dolls/${encodeURIComponent(dollId)}/pipeline-state`,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pipelineState,
      }),
    }
  );
  const body = await response.json().catch(() => ({}));
  const data = readSuccessResultData(body, body || {});

  if (!response.ok) {
    throw new Error(readFailureResultMessage(body, "Could not update pipeline stage."));
  }

  return {
    persisted: typeof data?.persisted === "boolean" ? data.persisted : true,
    pipelineState:
      data?.pipelineState &&
      typeof data.pipelineState === "object" &&
      !Array.isArray(data.pipelineState)
        ? data.pipelineState
        : pipelineState,
  };
}
