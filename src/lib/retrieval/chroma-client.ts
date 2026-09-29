import path from "path";
import { ChromaClient } from "chromadb";
import { config } from "@/lib/config";

export function createChromaClient(): ChromaClient {
  return new ChromaClient({
    host: config.chromaHost,
    port: config.chromaPort,
    ssl: config.chromaSsl,
  });
}

export async function assertChromaServerReachable(): Promise<void> {
  const client = createChromaClient();
  try {
    await client.heartbeat();
  } catch {
    throw new Error(
      `Cannot reach Chroma at ${config.chromaUrl}. Start the server with: npm run chroma:server`,
    );
  }
}

export function chromaServerHint(): string {
  return `Start Chroma in another terminal: npm run chroma:server (persists to ${path.resolve(config.chromaPath)})`;
}
