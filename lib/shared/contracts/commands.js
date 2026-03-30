export const INTERNAL_COMMAND_TYPES = Object.freeze({
  GENERATE_STORY: "GenerateStory",
  GENERATE_CONTENT_PACK: "GenerateContentPack",
  GENERATE_SOCIAL: "GenerateSocial",
  GENERATE_QR: "GenerateQr",
  ADVANCE_PIPELINE_STAGE: "AdvancePipelineStage",
});

export const PIPELINE_STAGE_COMMAND_ACTIONS = Object.freeze({
  COMPLETE: "complete",
  REOPEN: "reopen",
});

const COMMAND_TYPE_SET = new Set(Object.values(INTERNAL_COMMAND_TYPES));
const PIPELINE_STAGE_ACTION_SET = new Set(Object.values(PIPELINE_STAGE_COMMAND_ACTIONS));

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeIdentifier(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function normalizeMetadata(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function normalizePayload(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function normalizeCommandType(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return COMMAND_TYPE_SET.has(normalized) ? normalized : "";
}

function normalizePipelineStageAction(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return PIPELINE_STAGE_ACTION_SET.has(normalized) ? normalized : "";
}

export function isInternalCommandType(value) {
  return Boolean(normalizeCommandType(value));
}

export function isInternalCommandEnvelope(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  if (!isInternalCommandType(value.type)) {
    return false;
  }

  if (!isPlainObject(value.payload)) {
    return false;
  }

  if (value.metadata !== undefined && !isPlainObject(value.metadata)) {
    return false;
  }

  if (value.dollId !== undefined && !normalizeIdentifier(value.dollId)) {
    return false;
  }

  if (value.entityId !== undefined && !normalizeIdentifier(value.entityId)) {
    return false;
  }

  return true;
}

export function createInternalCommandEnvelope({
  type,
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  const normalizedType = normalizeCommandType(type);

  if (!normalizedType) {
    throw new Error("Invalid command type.");
  }

  const normalizedDollId = normalizeIdentifier(dollId);
  const normalizedEntityId = normalizeIdentifier(entityId);
  const normalizedMetadata = normalizeMetadata(metadata);
  const command = {
    type: normalizedType,
    payload: normalizePayload(payload),
  };

  if (normalizedDollId) {
    command.dollId = normalizedDollId;
  }

  if (normalizedEntityId) {
    command.entityId = normalizedEntityId;
  }

  if (normalizedMetadata) {
    command.metadata = normalizedMetadata;
  }

  return command;
}

export function createGenerateStoryCommand({ dollId, entityId, payload, metadata } = {}) {
  return createInternalCommandEnvelope({
    type: INTERNAL_COMMAND_TYPES.GENERATE_STORY,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createGenerateContentPackCommand({
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  return createInternalCommandEnvelope({
    type: INTERNAL_COMMAND_TYPES.GENERATE_CONTENT_PACK,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createGenerateSocialCommand({ dollId, entityId, payload, metadata } = {}) {
  return createInternalCommandEnvelope({
    type: INTERNAL_COMMAND_TYPES.GENERATE_SOCIAL,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createGenerateQrCommand({ dollId, entityId, payload, metadata } = {}) {
  return createInternalCommandEnvelope({
    type: INTERNAL_COMMAND_TYPES.GENERATE_QR,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createAdvancePipelineStageCommand({
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  const normalizedPayload = normalizePayload(payload);
  const action = normalizePipelineStageAction(normalizedPayload.action);

  if (!action) {
    throw new Error("Invalid pipeline stage action.");
  }

  return createInternalCommandEnvelope({
    type: INTERNAL_COMMAND_TYPES.ADVANCE_PIPELINE_STAGE,
    dollId,
    entityId,
    payload: {
      ...normalizedPayload,
      action,
    },
    metadata,
  });
}
