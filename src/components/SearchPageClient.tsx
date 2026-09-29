"use client";

import { FormEvent, useState } from "react";
import type { ParsedQuery } from "@/lib/products/schema";
import { ProductCard, type ProductHit } from "@/components/ProductCard";
import { SearchDebugStrip } from "@/components/SearchDebugStrip";

type SearchResponse = {
  products: ProductHit[];
  parsed: ParsedQuery;
  retrieval: {
    denseCount: number;
    sparseCount: number;
    filtersApplied?: ParsedQuery["filters"];
    rrfCandidateCount: number;
    rerankApplied: boolean;
    rerankScores?: Record<string, number>;
  };
  summary?: string;
  error?: string;
};

export function SearchPageClient() {
  const [query, setQuery] = useState(
    "Dell laptops under 85000 with 16GB RAM for work",
  );
  const [summarize, setSummarize] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, summarize }),
      });

      const json = (await response.json()) as SearchResponse;
      if (!response.ok) {
        throw new Error(json.error ?? "Search failed");
      }
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Hybrid RAG demo
        </p>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          E-commerce product search
        </h1>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
          Semantic search on descriptions (Chroma), BM25 keyword search on specs,
          metadata filters for brand/category/price, and optional Cohere rerank
          before grounded summaries.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Search query
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Try: ceramic vase hand painted under 3000"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={summarize}
            onChange={(e) => setSummarize(e.target.checked)}
          />
          Include AI summary (grounded on reranked results)
        </label>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {data?.summary ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            AI summary
          </h2>
          <p className="text-zinc-800 dark:text-zinc-200">{data.summary}</p>
        </section>
      ) : null}

      {data ? (
        <SearchDebugStrip parsed={data.parsed} retrieval={data.retrieval} />
      ) : null}

      {data?.products?.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : null}

      {data && data.products.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No products matched. Try a broader query or run ingest if the vector
          index is empty.
        </p>
      ) : null}
    </div>
  );
}
