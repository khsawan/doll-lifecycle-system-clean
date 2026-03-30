import dotenv from "dotenv";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAIServiceNodeListener } from "./lib/http.js";

const serviceRoot = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.resolve(serviceRoot, "../../.env.local"),
  quiet: true,
});

const portValue = process.env.AI_SERVICE_PORT || process.env.PORT || "4100";
const port = Number.parseInt(String(portValue), 10) || 4100;
const server = createServer(createAIServiceNodeListener());

server.listen(port, () => {
  console.log(`[ai-service] listening on http://127.0.0.1:${port}`);
});
