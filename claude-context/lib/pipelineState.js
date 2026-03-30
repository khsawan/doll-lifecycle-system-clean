export const PIPELINE_STAGE_ORDER = Object.freeze([
  "registered",
  "character",
  "content",
  "gateway",
  "ready",
]);

export const PIPELINE_STAGE_LABELS = Object.freeze({
  registered: "Registered",
  character: "Character",
  content: "Content",
  gateway: "Gateway",
  ready: "Ready",
});

export const PIPELINE_STAGE_STATUSES = Object.freeze(["locked", "open", "completed"]);

const PIPELINE_STAGE_SET = new Set(PIPELINE_STAGE_ORDER);
const PIPELINE_STATUS_SET = new Set(PIPELINE_STAGE_STATUSES);
const PIPELINE_COMPARISON_TIMESTAMP = "1970-01-01T00:00:00.000Z";

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePipelineTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function normalizePipelineStatus(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return PIPELINE_STATUS_SET.has(normalized) ? normalized : null;
}

function createStageState(status, timestamp) {
  return {
    status,
    updatedAt: timestamp,
    completedAt: status === "completed" ? timestamp : null,
    reopenedAt: null,
  };
}

function sanitizeStageState(value) {
  if (!isPlainObject(value)) {
    return {
      status: null,
      updatedAt: null,
      completedAt: null,
      reopenedAt: null,
    };
  }

  return {
    status: normalizePipelineStatus(value.status),
    updatedAt: normalizePipelineTimestamp(value.updatedAt),
    completedAt: normalizePipelineTimestamp(value.completedAt),
    reopenedAt: normalizePipelineTimestamp(value.reopenedAt),
  };
}

function clonePipelineState(pipelineState) {
  return PIPELINE_STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = { ...pipelineState[stage] };
    return acc;
  }, {});
}

function getHistoricalCompletedAt(stageState) {
  if (!PIPELINE_STATUS_SET.has(stageState?.status || "")) {
    return null;
  }

  return (
    stageState.completedAt ||
    (stageState.status === "completed" ? stageState.updatedAt : null) ||
    null
  );
}

function getHistoricalReopenedAt(stageState) {
  if (!PIPELINE_STATUS_SET.has(stageState?.status || "")) {
    return null;
  }

  if (!stageState.reopenedAt) {
    return null;
  }

  return stageState.status === "open" || getHistoricalCompletedAt(stageState)
    ? stageState.reopenedAt
    : null;
}

function hasValidPipelineStatus(sanitizedState) {
  return PIPELINE_STAGE_ORDER.some((stage) => Boolean(sanitizedState[stage].status));
}

function toComparablePipelineState(pipelineState) {
  return normalizePipelineState(pipelineState, {
    timestamp: PIPELINE_COMPARISON_TIMESTAMP,
  });
}

function buildSequentialStatuses(sanitizedState) {
  const firstIncompleteIndex = PIPELINE_STAGE_ORDER.findIndex(
    (stage) => sanitizedState[stage].status !== "completed"
  );

  if (firstIncompleteIndex === -1) {
    return PIPELINE_STAGE_ORDER.reduce((acc, stage) => {
      acc[stage] = "completed";
      return acc;
    }, {});
  }

  return PIPELINE_STAGE_ORDER.reduce((acc, stage, index) => {
    if (index < firstIncompleteIndex) {
      acc[stage] = "completed";
    } else if (index === firstIncompleteIndex) {
      acc[stage] = "open";
    } else {
      acc[stage] = "locked";
    }

    return acc;
  }, {});
}

function normalizeStageState(sourceStage, nextStatus, timestamp) {
  const statusChanged = sourceStage.status !== nextStatus;
  const updatedAt = !statusChanged && sourceStage.updatedAt ? sourceStage.updatedAt : timestamp;
  const historicalCompletedAt = getHistoricalCompletedAt(sourceStage);
  const historicalReopenedAt = getHistoricalReopenedAt(sourceStage);

  if (nextStatus === "completed") {
    return {
      status: nextStatus,
      updatedAt,
      completedAt: historicalCompletedAt,
      reopenedAt: historicalReopenedAt,
    };
  }

  if (nextStatus === "open") {
    return {
      status: nextStatus,
      updatedAt,
      completedAt: historicalCompletedAt,
      reopenedAt: historicalReopenedAt,
    };
  }

  return {
    status: nextStatus,
    updatedAt,
    completedAt: historicalCompletedAt,
    reopenedAt: historicalReopenedAt,
  };
}

function readStoredPipelineState(record) {
  if (!isPlainObject(record)) {
    return null;
  }

  if (isPlainObject(record.pipelineState)) {
    return record.pipelineState;
  }

  if (isPlainObject(record.pipeline_state)) {
    return record.pipeline_state;
  }

  return null;
}

export function createPipelineTimestamp(date = new Date()) {
  return normalizePipelineTimestamp(date) || new Date().toISOString();
}

export function createDefaultPipelineState(timestamp = createPipelineTimestamp()) {
  const normalizedTimestamp = normalizePipelineTimestamp(timestamp) || createPipelineTimestamp();

  return {
    registered: createStageState("open", normalizedTimestamp),
    character: createStageState("locked", normalizedTimestamp),
    content: createStageState("locked", normalizedTimestamp),
    gateway: createStageState("locked", normalizedTimestamp),
    ready: createStageState("locked", normalizedTimestamp),
  };
}

export function normalizePipelineState(pipelineState, options = {}) {
  const fallbackTimestamp =
    normalizePipelineTimestamp(options.timestamp) || createPipelineTimestamp();

  if (!isPlainObject(pipelineState)) {
    return createDefaultPipelineState(fallbackTimestamp);
  }

  try {
    const sanitizedState = PIPELINE_STAGE_ORDER.reduce((acc, stage) => {
      acc[stage] = sanitizeStageState(pipelineState[stage]);
      return acc;
    }, {});

    if (!hasValidPipelineStatus(sanitizedState)) {
      return createDefaultPipelineState(fallbackTimestamp);
    }

    // Legacy or malformed rows are rebuilt into the closest safe sequential shape.
    const sequentialStatuses = buildSequentialStatuses(sanitizedState);

    return PIPELINE_STAGE_ORDER.reduce((acc, stage) => {
      acc[stage] = normalizeStageState(
        sanitizedState[stage],
        sequentialStatuses[stage],
        fallbackTimestamp
      );
      return acc;
    }, {});
  } catch {
    return createDefaultPipelineState(fallbackTimestamp);
  }
}

export function getPipelineStageStatus(pipelineState, stage) {
  if (!PIPELINE_STAGE_SET.has(stage)) {
    return null;
  }

  return normalizePipelineState(pipelineState)[stage].status;
}

export function canCompletePipelineStage(pipelineState, stage) {
  if (!PIPELINE_STAGE_SET.has(stage)) {
    return false;
  }

  return normalizePipelineState(pipelineState)[stage].status === "open";
}

export function canReopenPipelineStage(pipelineState, stage) {
  if (!PIPELINE_STAGE_SET.has(stage)) {
    return false;
  }

  return normalizePipelineState(pipelineState)[stage].status === "completed";
}

export function getNextPipelineStage(stage) {
  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(stage);
  if (currentIndex < 0 || currentIndex >= PIPELINE_STAGE_ORDER.length - 1) {
    return null;
  }

  return PIPELINE_STAGE_ORDER[currentIndex + 1];
}

export function getDownstreamPipelineStages(stage) {
  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(stage);
  return currentIndex < 0 ? [] : PIPELINE_STAGE_ORDER.slice(currentIndex + 1);
}

export function getCurrentOpenPipelineStage(pipelineState) {
  const normalizedState = normalizePipelineState(pipelineState);

  return (
    PIPELINE_STAGE_ORDER.find((stage) => normalizedState[stage].status === "open") || null
  );
}

export function getPipelineStateSignature(pipelineState) {
  return JSON.stringify(toComparablePipelineState(pipelineState));
}

export function isSamePipelineState(leftPipelineState, rightPipelineState) {
  return getPipelineStateSignature(leftPipelineState) === getPipelineStateSignature(rightPipelineState);
}

export function completePipelineStageTransition(pipelineState, stage) {
  const timestamp = createPipelineTimestamp();
  const normalizedState = normalizePipelineState(pipelineState, { timestamp });

  if (!canCompletePipelineStage(normalizedState, stage)) {
    return normalizedState;
  }

  const nextState = clonePipelineState(normalizedState);
  nextState[stage] = {
    ...nextState[stage],
    status: "completed",
    updatedAt: timestamp,
    completedAt: timestamp,
  };

  const nextStage = getNextPipelineStage(stage);
  if (nextStage) {
    const nextStageState = nextState[nextStage];
    const hadCompletionHistory = Boolean(getHistoricalCompletedAt(nextStageState));

    nextState[nextStage] = {
      ...nextStageState,
      status: "open",
      updatedAt: timestamp,
      completedAt: getHistoricalCompletedAt(nextStageState),
      reopenedAt: hadCompletionHistory ? timestamp : nextStageState.reopenedAt || null,
    };
  }

  return normalizePipelineState(nextState, { timestamp });
}

export function reopenPipelineStageTransition(pipelineState, stage) {
  const timestamp = createPipelineTimestamp();
  const normalizedState = normalizePipelineState(pipelineState, { timestamp });

  if (!canReopenPipelineStage(normalizedState, stage)) {
    return normalizedState;
  }

  const nextState = clonePipelineState(normalizedState);
  nextState[stage] = {
    ...nextState[stage],
    status: "open",
    updatedAt: timestamp,
    completedAt: getHistoricalCompletedAt(nextState[stage]),
    reopenedAt: timestamp,
  };

  for (const downstreamStage of getDownstreamPipelineStages(stage)) {
    const downstreamState = nextState[downstreamStage];

    if (downstreamState.status === "locked") {
      continue;
    }

    nextState[downstreamStage] = {
      ...downstreamState,
      status: "locked",
      updatedAt: timestamp,
      completedAt: getHistoricalCompletedAt(downstreamState),
      reopenedAt: downstreamState.reopenedAt || null,
    };
  }

  return normalizePipelineState(nextState, { timestamp });
}

export function withNormalizedPipelineState(record, options = {}) {
  if (!isPlainObject(record)) {
    return record;
  }

  const normalizedState = normalizePipelineState(readStoredPipelineState(record), options);
  const nextRecord = {
    ...record,
    pipelineState: normalizedState,
  };

  if (hasOwn(record, "pipeline_state")) {
    nextRecord.pipeline_state = normalizedState;
  }

  return nextRecord;
}
