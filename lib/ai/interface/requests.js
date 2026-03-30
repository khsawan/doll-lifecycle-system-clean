import { isInternalCommandEnvelope } from "../../shared/contracts/index.js";
import { normalizeAIPayload } from "../domain/requests.js";
import {
  AI_TASKS,
  normalizeAIProvider,
  normalizeAITask,
} from "../domain/taskRouting.js";
import { createAIRequestId, normalizeAIRequestId } from "./trace.js";
import { sanitizeTransportObject } from "./transport.js";

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function normalizeIdentifier(value) {
  return readOptionalString(value);
}

export function isAIServiceRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  if (!normalizeAIRequestId(value.requestId)) {
    return false;
  }

  if (!normalizeAITask(value.task)) {
    return false;
  }

  if (!value.payload || typeof value.payload !== "object" || Array.isArray(value.payload)) {
    return false;
  }

  if (value.metadata !== undefined && (!value.metadata || typeof value.metadata !== "object")) {
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

export function createAIServiceRequest({
  requestId,
  task,
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  const normalizedTask = normalizeAITask(task);

  if (!normalizedTask) {
    throw new Error("Invalid AI service task.");
  }

  const request = {
    requestId: normalizeAIRequestId(requestId) || createAIRequestId(),
    task: normalizedTask,
    payload: normalizeAIPayload(payload),
    metadata: sanitizeTransportObject(metadata, {}),
  };
  const normalizedDollId = normalizeIdentifier(dollId);
  const normalizedEntityId = normalizeIdentifier(entityId);

  if (normalizedDollId) {
    request.dollId = normalizedDollId;
  }

  if (normalizedEntityId) {
    request.entityId = normalizedEntityId;
  }

  return request;
}

export function createGenerateStoryRequest({ requestId, dollId, entityId, payload, metadata } = {}) {
  return createAIServiceRequest({
    requestId,
    task: AI_TASKS.STORY,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createGenerateContentPackRequest({
  requestId,
  dollId,
  entityId,
  payload,
  metadata,
} = {}) {
  return createAIServiceRequest({
    requestId,
    task: AI_TASKS.CONTENT_PACK,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createGenerateSocialRequest({ requestId, dollId, entityId, payload, metadata } = {}) {
  return createAIServiceRequest({
    requestId,
    task: AI_TASKS.SOCIAL,
    dollId,
    entityId,
    payload,
    metadata,
  });
}

export function createAIServiceRequestFromCommand(command, task) {
  if (!isInternalCommandEnvelope(command)) {
    throw new Error("Invalid AI generation command.");
  }

  return createAIServiceRequest({
    requestId: command?.metadata?.requestId,
    task,
    dollId: command?.dollId,
    entityId: command?.entityId,
    payload: command?.payload,
    metadata: command?.metadata,
  });
}

export function readAIServiceRequestProvider(request) {
  return normalizeAIProvider(request?.metadata?.provider);
}
