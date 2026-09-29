import { ChatOpenAI } from "@langchain/openai";
import { config } from "@/lib/config";
import { CATEGORIES } from "@/lib/products/categories";
import {
  normalizeStructuredParsedQuery,
  parsedQueryStructuredSchema,
  type ParsedQuery,
} from "@/lib/products/schema";
import { applyPriceHintsToParsedQuery } from "@/lib/retrieval/price-filter-hints";

const systemPrompt = `You parse e-commerce product search queries into structured retrieval parts.

Categories (exact spelling): ${CATEGORIES.join(", ")}.

Rules:
- semanticQuery: natural language for matching product descriptions (use cases, vibes).
- keywordQuery: specs, model numbers, sizes, RAM, inches, author names, materials — short keyword-focused string.
- filters.brand: when user names a brand (e.g. LG, Dell). Use null if none.
- filters.category: when user wants a category from the list (e.g. "TV", "laptops" → Laptop). Use null if none.
- filters.priceMin / priceMax: numeric INR limits ("under X" → priceMax only, "above X" → priceMin only). Use null for unused bound.
- Example: "LG TV under 200000" → priceMax 200000, priceMin null.
- Example: "laptops above 85000 for work" → priceMin 85000, priceMax null, category Laptop.
- Set filters to null if no metadata filters apply.`;

export async function parseSearchQuery(userQuery: string): Promise<ParsedQuery> {
  if (!config.openAiApiKey) {
    console.warn(
      "[parseSearchQuery] OPENAI_API_KEY is missing; using raw query (no structured filters).",
    );
    return {
      semanticQuery: userQuery,
      keywordQuery: userQuery,
    };
  }

  const model = new ChatOpenAI({
    apiKey: config.openAiApiKey,
    model: config.chatModel,
    temperature: 0,
  });

  const structured = model.withStructuredOutput(parsedQueryStructuredSchema, {
    name: "parse_search_query",
  });

  try {
    const raw = await structured.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ]);
    const normalized = normalizeStructuredParsedQuery(raw);
    return applyPriceHintsToParsedQuery(userQuery, normalized);
  } catch (error) {
    console.error(
      "[parseSearchQuery] Structured parse failed; using raw query.",
      error instanceof Error ? error.message : error,
    );
    return {
      semanticQuery: userQuery,
      keywordQuery: userQuery,
    };
  }
}
