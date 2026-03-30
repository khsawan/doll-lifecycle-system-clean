# AI Service

This folder is the first extracted AI microservice path for the Doll Lifecycle System.

It is still designed for a safe rollout:

- the main app keeps its in-process AI path
- the main app can switch to this service through `AI_SERVICE_MODE=remote`
- the main app can optionally fall back to local execution with `AI_SERVICE_ALLOW_LOCAL_FALLBACK=true`

## Endpoints

- `POST /generate/story`
- `POST /generate/content-pack`
- `POST /generate/social`
- `GET /health`

Each `POST` endpoint accepts the existing AI service request DTO and returns the existing AI service response DTO.

## Run

```powershell
node apps/ai-service/server.mjs
```

Optional env vars:

- `AI_SERVICE_PORT` or `PORT`

The main app can target this service with:

- `AI_SERVICE_MODE=remote`
- `AI_SERVICE_BASE_URL=http://127.0.0.1:4100`
- `AI_SERVICE_TIMEOUT_MS=8000`
- `AI_SERVICE_ALLOW_LOCAL_FALLBACK=false`
