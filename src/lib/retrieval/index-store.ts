import { Chroma } from "@langchain/community/vectorstores/chroma";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { OpenAIEmbeddings } from "@langchain/openai";
import fs from "fs";
import { config } from "@/lib/config";
import { loadProducts } from "@/lib/products/load-products";
import {
  assertChromaServerReachable,
  chromaServerHint,
  createChromaClient,
} from "@/lib/retrieval/chroma-client";
import {
  toKeywordDocument,
  toSemanticDocument,
} from "@/lib/retrieval/document-builder";

export type IndexStore = {
  vectorStore: Chroma;
  bm25: BM25Retriever;
};

declare global {
  var __indexStorePromise: Promise<IndexStore> | undefined;
}

function createEmbeddings() {
  if (!config.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for embeddings.");
  }
  return new OpenAIEmbeddings({
    apiKey: config.openAiApiKey,
    model: config.embeddingModel,
  });
}

export async function getIndexStore(): Promise<IndexStore> {
  if (!global.__indexStorePromise) {
    global.__indexStorePromise = initIndexStore();
  }
  return global.__indexStorePromise;
}

async function initIndexStore(): Promise<IndexStore> {
  await assertChromaServerReachable();

  const products = loadProducts();
  const chromaClient = createChromaClient();
  const embeddings = createEmbeddings();

  const vectorStore = new Chroma(embeddings, {
    collectionName: config.collectionName,
    index: chromaClient,
  });

  try {
    await vectorStore.ensureCollection();
  } catch {
    throw new Error(
      `Chroma collection "${config.collectionName}" not found. Run npm run ingest after ${chromaServerHint()}`,
    );
  }

  const keywordDocs = products.map(toKeywordDocument);
  const bm25 = BM25Retriever.fromDocuments(keywordDocs, {
    k: config.kRetrieve,
  });

  return { vectorStore, bm25 };
}

export async function recreateChromaCollection(): Promise<Chroma> {
  await assertChromaServerReachable();

  fs.mkdirSync(config.chromaPath, { recursive: true });

  const chromaClient = createChromaClient();

  try {
    await chromaClient.deleteCollection({ name: config.collectionName });
  } catch {
    // Collection may not exist on first run.
  }

  const embeddings = createEmbeddings();
  const products = loadProducts();
  const documents = products.map(toSemanticDocument);

  const vectorStore = await Chroma.fromDocuments(documents, embeddings, {
    collectionName: config.collectionName,
    index: chromaClient,
  });

  return vectorStore;
}

export function resetIndexStoreCache() {
  global.__indexStorePromise = undefined;
}
