import { ChatOpenAI } from "@langchain/openai";
import { config } from "@/lib/config";
import { formatProductSpecs } from "@/lib/retrieval/document-builder";
import type { SearchResultItem } from "@/lib/retrieval/hybrid-search";

export async function summarizeResults(
  query: string,
  items: SearchResultItem[],
): Promise<string> {
  if (!config.openAiApiKey) {
    return "Set OPENAI_API_KEY to enable AI summaries.";
  }

  if (items.length === 0) {
    return "No matching products were found for this query.";
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

  const model = new ChatOpenAI({
    apiKey: config.openAiApiKey,
    model: config.chatModel,
    temperature: 0.2,
  });

  const response = await model.invoke([
    {
      role: "system",
      content:
        "You are a shopping assistant. Answer ONLY using the provided product context. Cite products by id and name. If context is insufficient, say you cannot answer from the catalog. Keep the answer to 3-5 sentences.",
    },
    {
      role: "user",
      content: `User query: ${query}\n\nProduct context:\n${context}`,
    },
  ]);

  const text = response.content;
  return typeof text === "string" ? text : JSON.stringify(text);
}
