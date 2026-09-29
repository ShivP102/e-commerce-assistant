import type { Product, QueryFilters } from "@/lib/products/schema";

export function matchesFilters(
  product: Product,
  filters?: QueryFilters,
): boolean {
  if (!filters) return true;

  if (
    filters.brand &&
    product.brand.toLowerCase() !== filters.brand.toLowerCase()
  ) {
    return false;
  }

  if (filters.category && product.category !== filters.category) {
    return false;
  }

  if (filters.priceMin !== undefined && product.price < filters.priceMin) {
    return false;
  }

  if (filters.priceMax !== undefined && product.price > filters.priceMax) {
    return false;
  }

  return true;
}

import type { Where } from "chromadb";

export function buildChromaWhere(
  filters?: QueryFilters,
): Where | undefined {
  if (!filters) return undefined;

  const clauses: Where[] = [];

  if (filters.brand) {
    clauses.push({ brand: filters.brand });
  }
  if (filters.category) {
    clauses.push({ category: filters.category });
  }
  if (filters.priceMin !== undefined) {
    clauses.push({ price: { $gte: filters.priceMin } });
  }
  if (filters.priceMax !== undefined) {
    clauses.push({ price: { $lte: filters.priceMax } });
  }

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

export type RankedId = {
  id: string;
  rrfScore: number;
  matchedVia: "semantic" | "keyword" | "both";
};

export function reciprocalRankFusion(
  semanticIds: string[],
  keywordIds: string[],
  weights: [number, number],
  c: number,
  topK: number,
): RankedId[] {
  const [denseWeight, sparseWeight] = weights;
  const scores = new Map<string, number>();
  const sources = new Map<string, Set<"semantic" | "keyword">>();

  const addList = (ids: string[], weight: number, source: "semantic" | "keyword") => {
    ids.forEach((id, index) => {
      const rank = index + 1;
      scores.set(id, (scores.get(id) ?? 0) + weight / (rank + c));
      const set = sources.get(id) ?? new Set();
      set.add(source);
      sources.set(id, set);
    });
  };

  addList(semanticIds, denseWeight, "semantic");
  addList(keywordIds, sparseWeight, "keyword");

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, rrfScore]) => {
      const via = sources.get(id) ?? new Set<"semantic" | "keyword">();
      let matchedVia: RankedId["matchedVia"] = "semantic";
      if (via.has("semantic") && via.has("keyword")) matchedVia = "both";
      else if (via.has("keyword")) matchedVia = "keyword";
      return { id, rrfScore, matchedVia };
    });
}
