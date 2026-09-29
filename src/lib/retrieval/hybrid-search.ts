import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { config } from "@/lib/config";
import { getProductById, loadProducts } from "@/lib/products/load-products";
import type { Product, ParsedQuery } from "@/lib/products/schema";
import { toKeywordDocument } from "@/lib/retrieval/document-builder";
import {
  buildChromaWhere,
  matchesFilters,
  reciprocalRankFusion,
  type RankedId,
} from "@/lib/retrieval/filters";
import { getIndexStore } from "@/lib/retrieval/index-store";
import { rerankProducts } from "@/lib/retrieval/rerank";

export type SearchResultItem = {
  product: Product;
  rrfScore: number;
  rerankScore?: number;
  matchedVia: RankedId["matchedVia"];
};

export type HybridSearchResult = {
  items: SearchResultItem[];
  parsed: ParsedQuery;
  retrieval: {
    denseCount: number;
    sparseCount: number;
    filtersApplied: ParsedQuery["filters"];
    rrfCandidateCount: number;
    rerankApplied: boolean;
    rerankScores?: Record<string, number>;
  };
};

function metadataId(doc: Document): string | undefined {
  const id = doc.metadata?.id;
  return typeof id === "string" ? id : undefined;
}

async function sparseSearch(
  keywordQuery: string,
  filters: ParsedQuery["filters"],
  k: number,
): Promise<string[]> {
  const products = loadProducts().filter((p) => matchesFilters(p, filters));
  const docs = products.map(toKeywordDocument);
  const retriever = BM25Retriever.fromDocuments(docs, { k });
  const results = await retriever.invoke(keywordQuery);
  return results
    .map(metadataId)
    .filter((id): id is string => Boolean(id));
}

function normalizeParsedFilters(parsed: ParsedQuery): ParsedQuery {
  if (!parsed.filters?.brand) return parsed;

  const canonical = loadProducts().find(
    (p) => p.brand.toLowerCase() === parsed.filters!.brand!.toLowerCase(),
  )?.brand;

  if (!canonical) return parsed;

  return {
    ...parsed,
    filters: { ...parsed.filters, brand: canonical },
  };
}

export async function hybridSearch(
  userQuery: string,
  parsedInput: ParsedQuery,
): Promise<HybridSearchResult> {
  const parsed = normalizeParsedFilters(parsedInput);
  const { vectorStore } = await getIndexStore();
  const where = buildChromaWhere(parsed.filters);

  const denseDocs = await vectorStore.similaritySearch(
    parsed.semanticQuery,
    config.kRetrieve,
    where,
  );
  const denseIds = denseDocs
    .map(metadataId)
    .filter((id): id is string => Boolean(id));

  const sparseIds = await sparseSearch(
    parsed.keywordQuery,
    parsed.filters,
    config.kRetrieve,
  );

  const ranked = reciprocalRankFusion(
    denseIds,
    sparseIds,
    [config.hybridDenseWeight, config.hybridSparseWeight],
    config.rrfC,
    config.kRetrieve,
  );

  const candidateProducts = ranked
    .map((entry) => {
      const product = getProductById(entry.id);
      if (!product) return null;
      return { ...entry, product };
    })
    .filter((item): item is RankedId & { product: Product } => item !== null);

  const { items, rerankApplied, rerankScores } = await rerankProducts(
    userQuery,
    candidateProducts,
  );

  return {
    items,
    parsed,
    retrieval: {
      denseCount: denseIds.length,
      sparseCount: sparseIds.length,
      filtersApplied: parsed.filters,
      rrfCandidateCount: ranked.length,
      rerankApplied,
      rerankScores,
    },
  };
}
