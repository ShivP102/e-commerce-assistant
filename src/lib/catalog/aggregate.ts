import { loadProducts } from "@/lib/products/load-products";
import type { QueryFilters } from "@/lib/products/schema";
import { matchesFilters } from "@/lib/retrieval/filters";

export function countCatalogMatches(filters?: QueryFilters): number {
  return loadProducts().filter((product) => matchesFilters(product, filters))
    .length;
}
