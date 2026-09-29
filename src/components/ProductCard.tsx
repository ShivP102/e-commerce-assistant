"use client";

import { formatProductSpecs } from "@/lib/retrieval/document-builder";
import type { Product } from "@/lib/products/schema";

export type ProductHit = Product & {
  _retrieval?: {
    rrfScore: number;
    rerankScore?: number;
    matchedVia: "semantic" | "keyword" | "both";
  };
};

type ProductCardProps = {
  product: ProductHit;
};

export function ProductCard({ product }: ProductCardProps) {
  const specs = formatProductSpecs(product);
  const via = product._retrieval?.matchedVia;

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h3>
          <p className="text-sm text-zinc-500">
            {product.id} · {product.brand} · {product.category}
          </p>
        </div>
        <p className="text-base font-medium text-emerald-700 dark:text-emerald-400">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
      </div>

      {specs ? (
        <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">{specs}</p>
      ) : null}

      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
        {product.description}
      </p>

      {product._retrieval ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
            match: {via}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
            RRF {product._retrieval.rrfScore.toFixed(4)}
          </span>
          {product._retrieval.rerankScore !== undefined ? (
            <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
              rerank {product._retrieval.rerankScore.toFixed(3)}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
