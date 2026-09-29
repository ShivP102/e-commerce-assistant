import { NextResponse } from "next/server";
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
    const result = await hybridSearch(query, parsed);

    let summary: string | undefined;
    if (body.summarize) {
      summary = await summarizeResults(query, result.items);
    }

    return NextResponse.json({
      products: result.items.map((item) => ({
        ...item.product,
        _retrieval: {
          rrfScore: item.rrfScore,
          rerankScore: item.rerankScore,
          matchedVia: item.matchedVia,
        },
      })),
      parsed: result.parsed,
      retrieval: result.retrieval,
      summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected search error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
