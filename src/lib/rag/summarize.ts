import { ChatOpenAI } from "@langchain/openai";
import { config } from "@/lib/config";
import type { QueryIntent } from "@/lib/products/schema";
import { formatProductSpecs } from "@/lib/retrieval/document-builder";
import type { SearchResultItem } from "@/lib/retrieval/hybrid-search";

export type SummarizeContext = {
  intent: QueryIntent;
  totalMatching: number;
  productsReturned: number;
};

function buildAggregateFacts(ctx: SummarizeContext): string {
  const filterNote =
    ctx.totalMatching === 0
      ? "No products in the catalog match the applied filters."
      : `There are exactly ${ctx.totalMatching} product(s) in the catalog matching the applied filters.`;

  if (ctx.intent === "count") {
    return `${filterNote} The product grid below shows ${ctx.productsReturned} top-ranked suggestions for relevance (not necessarily every matching item).`;
  }

  if (ctx.intent === "list") {
    return `${filterNote} Showing ${ctx.productsReturned} items per page/rank limit; use filters to narrow the catalog set.`;
  }

  return filterNote;
}

export async function summarizeResults(
  query: string,
  items: SearchResultItem[],
  aggregate?: SummarizeContext,
): Promise<string> {
  const facts =
    aggregate && (aggregate.intent === "count" || aggregate.intent === "list")
      ? buildAggregateFacts(aggregate)
      : undefined;

  if (items.length === 0) {
    if (facts) return facts;
    return "No matching products were found for this query.";
  }

  if (!config.openAiApiKey) {
    return facts ?? "Set OPENAI_API_KEY to enable AI summaries.";
  }

  const context = items
    .slice(0, config.kSummary)
    .map((item, index) => {
      const p = item.product;
      return [
        `[${index + 1}] id=${p.id} name=${p.name} brand=${p.brand} category=${p.category} price=₹${p.price}`,
        `specs: ${formatProductSpecs(p)}`,
        `description: ${p.description}`,
      ].join("\n");
    })
    .join("\n\n");

  const systemParts = [
    "You are a shopping assistant. Answer ONLY using the provided product context. Cite products by id and name.",
  ];

  if (facts) {
    systemParts.push(
      `The user already sees this catalog fact (do NOT repeat it verbatim or paraphrase the count): "${facts}"`,
      "Write 2-4 sentences ONLY about the sample products in the context. Do not restate totals, grid size, or filter counts.",
    );
  } else {
    systemParts.push(
      "If context is insufficient, say you cannot answer from the catalog. Keep the answer to 3-5 sentences.",
    );
  }

  const model = new ChatOpenAI({
    apiKey: config.openAiApiKey,
    model: config.chatModel,
    temperature: 0.2,
  });

  const response = await model.invoke([
    { role: "system", content: systemParts.join(" ") },
    {
      role: "user",
      content: facts
        ? `User query: ${query}\n\nProduct context (sample only — do not infer catalog totals from this list):\n${context}`
        : `User query: ${query}\n\nProduct context:\n${context}`,
    },
  ]);

  const text = response.content;
  const narrative = typeof text === "string" ? text.trim() : JSON.stringify(text);

  if (facts) {
    const deduped = narrative.startsWith(facts)
      ? narrative.slice(facts.length).trim()
      : narrative.replace(facts, "").trim();
    return deduped ? `${facts}\n\n${deduped}` : facts;
  }

  return narrative;
}
