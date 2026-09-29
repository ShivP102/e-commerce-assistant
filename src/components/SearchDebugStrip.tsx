"use client";

import type { ParsedQuery, QueryIntent } from "@/lib/products/schema";

type RetrievalDebug = {
  denseCount: number;
  sparseCount: number;
  filtersApplied?: ParsedQuery["filters"];
  rrfCandidateCount: number;
  rerankApplied: boolean;
  rerankScores?: Record<string, number>;
};

type SearchDebugStripProps = {
  parsed?: ParsedQuery;
  retrieval?: RetrievalDebug;
  aggregate?: {
    intent: QueryIntent;
    totalMatching: number;
    productsReturned: number;
  };
};

export function SearchDebugStrip({
  parsed,
  retrieval,
  aggregate,
}: SearchDebugStripProps) {
  if (!parsed && !retrieval && !aggregate) return null;

  return (
    <details className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
      <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-200">
        Retrieval debug
      </summary>
      <div className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
        {aggregate ? (
          <ul className="list-inside list-disc space-y-1">
            <li>Intent: {aggregate.intent}</li>
            <li>Catalog total (filtered): {aggregate.totalMatching}</li>
            <li>Products returned (ranked): {aggregate.productsReturned}</li>
          </ul>
        ) : null}
        {parsed ? (
          <pre className="overflow-x-auto rounded bg-white p-2 text-xs dark:bg-zinc-950">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        ) : null}
        {retrieval ? (
          <ul className="list-inside list-disc space-y-1">
            <li>Dense hits: {retrieval.denseCount}</li>
            <li>BM25 hits: {retrieval.sparseCount}</li>
            <li>RRF pool: {retrieval.rrfCandidateCount}</li>
            <li>Rerank applied: {retrieval.rerankApplied ? "yes" : "no"}</li>
          </ul>
        ) : null}
      </div>
    </details>
  );
}
