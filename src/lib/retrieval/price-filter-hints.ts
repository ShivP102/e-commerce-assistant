import type { ParsedQuery, QueryFilters } from "@/lib/products/schema";

function parseInrAmount(raw: string): number | undefined {
  const normalized = raw.replace(/,/g, "").trim();
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

export type PriceHints = {
  priceMin?: number;
  priceMax?: number;
  hasAboveLanguage: boolean;
  hasUnderLanguage: boolean;
};

const UNDER_PATTERN =
  /\b(?:under|below|less\s+than|upto|up\s+to|max(?:imum)?|within)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\b/i;
const ABOVE_PATTERN =
  /\b(?:above|over|more\s+than|at\s+least|min(?:imum)?|from)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\b/i;
const TRAILING_PLUS_PATTERN =
  /\b([\d,]+)\s*(?:\+|and\s+above|or\s+more)\b/i;

/** Deterministic price bounds from natural language (overrides LLM when patterns match). */
export function extractPriceHints(query: string): PriceHints {
  const hints: PriceHints = {
    hasAboveLanguage: false,
    hasUnderLanguage: false,
  };

  const underMatch = query.match(UNDER_PATTERN);
  if (underMatch?.[1]) {
    hints.hasUnderLanguage = true;
    hints.priceMax = parseInrAmount(underMatch[1]);
  }

  const aboveMatch = query.match(ABOVE_PATTERN);
  if (aboveMatch?.[1]) {
    hints.hasAboveLanguage = true;
    hints.priceMin = parseInrAmount(aboveMatch[1]);
  }

  const trailingMatch = query.match(TRAILING_PLUS_PATTERN);
  if (trailingMatch?.[1] && hints.priceMin === undefined) {
    hints.hasAboveLanguage = true;
    hints.priceMin = parseInrAmount(trailingMatch[1]);
  }

  return hints;
}

export function applyPriceHintsToParsedQuery(
  userQuery: string,
  parsed: ParsedQuery,
): ParsedQuery {
  const hints = extractPriceHints(userQuery);
  const filters: QueryFilters = { ...parsed.filters };

  if (hints.priceMin !== undefined) {
    filters.priceMin = hints.priceMin;
    if (hints.hasAboveLanguage && !hints.hasUnderLanguage) {
      delete filters.priceMax;
    }
  }

  if (hints.priceMax !== undefined) {
    filters.priceMax = hints.priceMax;
    if (hints.hasUnderLanguage && !hints.hasAboveLanguage) {
      delete filters.priceMin;
    }
  }

  if (
    filters.priceMin !== undefined &&
    filters.priceMax !== undefined &&
    filters.priceMin > filters.priceMax
  ) {
    if (hints.hasAboveLanguage && !hints.hasUnderLanguage) {
      delete filters.priceMax;
    } else if (hints.hasUnderLanguage && !hints.hasAboveLanguage) {
      delete filters.priceMin;
    } else {
      delete filters.priceMax;
    }
  }

  const next: ParsedQuery = { ...parsed };
  if (Object.keys(filters).length > 0) {
    next.filters = filters;
  } else {
    delete next.filters;
  }

  return next;
}
