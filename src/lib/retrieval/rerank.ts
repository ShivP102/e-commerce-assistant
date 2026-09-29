import { Document } from "@langchain/core/documents";
import { CohereRerank } from "@langchain/cohere";
import { config } from "@/lib/config";
import type { Product } from "@/lib/products/schema";
import { toRerankText } from "@/lib/retrieval/document-builder";
import type { RankedId } from "@/lib/retrieval/filters";
import type { SearchResultItem } from "@/lib/retrieval/hybrid-search";

type Candidate = RankedId & { product: Product };

export async function rerankProducts(
  userQuery: string,
  candidates: Candidate[],
): Promise<{
  items: SearchResultItem[];
  rerankApplied: boolean;
  rerankScores?: Record<string, number>;
}> {
  if (candidates.length === 0) {
    return { items: [], rerankApplied: false };
  }

  const baseItems: SearchResultItem[] = candidates
    .slice(0, config.kFinal)
    .map((c) => ({
      product: c.product,
      rrfScore: c.rrfScore,
      matchedVia: c.matchedVia,
    }));

  if (!config.rerankEnabled || !config.cohereApiKey) {
    return { items: baseItems, rerankApplied: false };
  }

  try {
    const reranker = new CohereRerank({
      apiKey: config.cohereApiKey,
      model: config.cohereRerankModel,
      topN: config.kFinal,
    });

    const documents = candidates.map(
      (c) =>
        new Document({
          pageContent: toRerankText(c.product),
          metadata: { id: c.product.id },
        }),
    );

    const ranked = await reranker.rerank(documents, userQuery, {
      topN: config.kFinal,
    });

    const rerankScores: Record<string, number> = {};
    const items: SearchResultItem[] = [];

    for (const hit of ranked) {
      const candidate = candidates[hit.index];
      if (!candidate) continue;
      rerankScores[candidate.product.id] = hit.relevanceScore;
      items.push({
        product: candidate.product,
        rrfScore: candidate.rrfScore,
        rerankScore: hit.relevanceScore,
        matchedVia: candidate.matchedVia,
      });
    }

    return { items, rerankApplied: true, rerankScores };
  } catch {
    return { items: baseItems, rerankApplied: false };
  }
}
