import path from "path";

const root = process.cwd();

function env(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

export const config = {
  get chromaPath() {
    return env("CHROMA_PATH") ?? path.join(root, "data", "chroma");
  },
  get chromaHost() {
    return env("CHROMA_HOST", "localhost")!;
  },
  get chromaPort() {
    return Number(env("CHROMA_PORT", "8000"));
  },
  get chromaSsl() {
    return env("CHROMA_SSL") === "true";
  },
  get chromaUrl() {
    const protocol = this.chromaSsl ? "https" : "http";
    return `${protocol}://${this.chromaHost}:${this.chromaPort}`;
  },
  productsPath: path.join(root, "data", "products.json"),
  get collectionName() {
    return env("COLLECTION_NAME", "products")!;
  },
  get openAiApiKey() {
    return env("OPENAI_API_KEY");
  },
  get cohereApiKey() {
    return env("COHERE_API_KEY");
  },
  get rerankEnabled() {
    return env("RERANK_ENABLED") !== "false" && Boolean(this.cohereApiKey);
  },
  get kRetrieve() {
    return Number(env("K_RETRIEVE", "30"));
  },
  get kFinal() {
    return Number(env("K_FINAL", "10"));
  },
  get kSummary() {
    return Number(env("K_SUMMARY", "5"));
  },
  get hybridDenseWeight() {
    return Number(env("HYBRID_DENSE_WEIGHT", "0.5"));
  },
  get hybridSparseWeight() {
    return Number(env("HYBRID_SPARSE_WEIGHT", "0.5"));
  },
  get rrfC() {
    return Number(env("RRF_C", "60"));
  },
  embeddingModel: "text-embedding-3-small",
  chatModel: "gpt-4o-mini",
  cohereRerankModel: "rerank-v3.5",
} as const;
