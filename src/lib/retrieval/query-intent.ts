import type { QueryIntent } from "@/lib/products/schema";

const COUNT_PATTERN =
  /\b(how many|how much|count|number of|total number|total)\b/i;
const LIST_ALL_PATTERN =
  /\b(list all|show all|all .+ available|every)\b/i;

export function detectQueryIntent(userQuery: string): QueryIntent {
  if (COUNT_PATTERN.test(userQuery)) return "count";
  if (LIST_ALL_PATTERN.test(userQuery)) return "list";
  return "search";
}

export function mergeQueryIntent(
  userQuery: string,
  intentFromModel: QueryIntent | null | undefined,
): QueryIntent {
  const heuristic = detectQueryIntent(userQuery);
  if (heuristic === "count" || heuristic === "list") return heuristic;
  if (intentFromModel === "count" || intentFromModel === "list") {
    return intentFromModel;
  }
  return intentFromModel ?? "search";
}
