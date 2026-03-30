import { persistAdminPipelineState } from "../../admin/services/dolls";

export async function saveProductionPipelineState(
  client,
  dollId,
  pipelineState,
  { persistPipelineState = persistAdminPipelineState } = {}
) {
  return persistPipelineState(client, dollId, pipelineState);
}
