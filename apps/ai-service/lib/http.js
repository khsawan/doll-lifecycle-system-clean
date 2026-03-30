import {
  createGenerateContentPackRequest,
  createGenerateSocialRequest,
  createGenerateStoryRequest,
} from "../../../lib/ai/interface/requests.js";
import { createInProcessAIService } from "../../../lib/ai/interface/service.js";
import { normalizeAIServiceError } from "../../../lib/ai/interface/errors.js";
import { createAITraceMetadata, normalizeAIRequestId } from "../../../lib/ai/interface/trace.js";

function readOptionalString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

const AI_SERVICE_ROUTE_TABLE = Object.freeze({
  "/generate/story": {
    createRequest: createGenerateStoryRequest,
    execute(service, request) {
      return service.generateStory({ request });
    },
    task: "story",
  },
  "/generate/content-pack": {
    createRequest: createGenerateContentPackRequest,
    execute(service, request) {
      return service.generateContentPack({ request });
    },
    task: "content_pack",
  },
  "/generate/social": {
    createRequest: createGenerateSocialRequest,
    execute(service, request) {
      return service.generateSocial({ request });
    },
    task: "social",
  },
});

function buildJsonResponse(status, body) {
  return {
    status,
    body,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  };
}

function mapAIServiceResultStatus(result) {
  if (result?.ok === true) {
    return 200;
  }

  return result?.retryable ? 500 : 400;
}

export async function handleAIServiceHttpRequest({
  method,
  pathname,
  body,
  service = createInProcessAIService(),
} = {}) {
  const normalizedMethod = readOptionalString(method).toUpperCase();
  const normalizedPath = readOptionalString(pathname) || "/";

  if (normalizedMethod === "GET" && normalizedPath === "/health") {
    return buildJsonResponse(200, {
      ok: true,
      service: "ai-service",
      status: "healthy",
    });
  }

  const route = AI_SERVICE_ROUTE_TABLE[normalizedPath];

  if (!route) {
    return buildJsonResponse(404, {
      ok: false,
      code: "AI_INVALID_REQUEST",
      message: "Route not found.",
      retryable: false,
    });
  }

  if (normalizedMethod !== "POST") {
    return buildJsonResponse(405, {
      ok: false,
      code: "AI_INVALID_REQUEST",
      message: "Method not allowed.",
      retryable: false,
    });
  }

  try {
    const request = route.createRequest(body || {});
    const result = await route.execute(service, request);

    return buildJsonResponse(mapAIServiceResultStatus(result), result);
  } catch (error) {
    const requestId = normalizeAIRequestId(body?.requestId);
    const failure = normalizeAIServiceError(error, {
      requestId,
      trace: createAITraceMetadata({
        requestId,
        task: route.task,
        dollId: body?.dollId,
        entityId: body?.entityId,
        metadata: body?.metadata,
        executionMode: "service_http",
      }),
      fallbackMessage: "AI service request failed.",
    });

    return buildJsonResponse(mapAIServiceResultStatus(failure), failure);
  }
}

async function readJsonRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return null;
  }

  const bodyText = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(bodyText);
  } catch {
    return null;
  }
}

export function createAIServiceNodeListener({ service } = {}) {
  const resolvedService = service || createInProcessAIService();

  return async function aiServiceNodeListener(request, response) {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const body = await readJsonRequestBody(request);
    const result = await handleAIServiceHttpRequest({
      method: request.method,
      pathname: url.pathname,
      body,
      service: resolvedService,
    });

    response.writeHead(result.status, result.headers);
    response.end(JSON.stringify(result.body));
  };
}
