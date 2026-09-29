import { Document } from "@langchain/core/documents";
import type { Product } from "@/lib/products/schema";

export function toChromaMetadata(product: Product): Record<string, string | number> {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
  };
}

export function toSemanticDocument(product: Product): Document {
  return new Document({
    pageContent: product.description,
    metadata: toChromaMetadata(product),
  });
}

function formatSpecValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

export function toKeywordDocument(product: Product): Document {
  const specEntries = Object.entries(product).filter(
    ([key]) => key !== "description",
  );
  const specText = specEntries
    .map(([key, value]) => `${key}: ${formatSpecValue(value)}`)
    .join(" ");

  return new Document({
    pageContent: specText,
    metadata: toChromaMetadata(product),
  });
}

export function toRerankText(product: Product): string {
  const excerpt =
    product.description.length > 240
      ? `${product.description.slice(0, 240)}…`
      : product.description;

  const keywordDoc = toKeywordDocument(product);
  return `${keywordDoc.pageContent} description: ${excerpt}`;
}

export function formatProductSpecs(product: Product): string {
  const skip = new Set(["id", "name", "brand", "category", "price", "description"]);
  return Object.entries(product)
    .filter(([key]) => !skip.has(key))
    .map(([key, value]) => `${key}: ${formatSpecValue(value)}`)
    .join(" · ");
}
