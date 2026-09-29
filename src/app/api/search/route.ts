import { NextResponse } from "next/server";
import { countCatalogMatches } from "@/lib/catalog/aggregate";
import { parseSearchQuery } from "@/lib/retrieval/query-parser";
import { hybridSearch } from "@/lib/retrieval/hybrid-search";
import { summarizeResults } from "@/lib/rag/summarize";

export const runtime = "nodejs";

type SearchRequestBody = {
  query?: string;
  summarize?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchRequestBody;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 },
      );
    }

    const parsed = await parseSearchQuery(query);
    const totalMatching = countCatalogMatches(parsed.filters);
    const result = await hybridSearch(query, parsed);

    const products = result.items.map((item) => ({
      ...item.product,
      _retrieval: {
        rrfScore: item.rrfScore,
        rerankScore: item.rerankScore,
        matchedVia: item.matchedVia,
      },
    }));

    const aggregate = {
      intent: parsed.intent,
      totalMatching,
      productsReturned: products.length,
    };

    let summary: string | undefined;
    if (body.summarize) {
      summary = await summarizeResults(query, result.items, aggregate);
    }

    return NextResponse.json({
      products,
      parsed,
      aggregate,
      retrieval: result.retrieval,
      summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected search error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
