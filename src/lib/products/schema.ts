import { z } from "zod";
import { CATEGORIES } from "./categories";

const baseProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.enum(CATEGORIES),
  price: z.number().int().positive(),
  description: z.string(),
});

export const laptopSchema = baseProductSchema.extend({
  category: z.literal("Laptop"),
  ram: z.string(),
  storage: z.string(),
  processor: z.string(),
  screenInches: z.number(),
});

export const tvSchema = baseProductSchema.extend({
  category: z.literal("TV"),
  screenInches: z.number(),
  resolution: z.string(),
  panelType: z.string(),
  smartTv: z.boolean(),
});

export const bookSchema = baseProductSchema.extend({
  category: z.literal("Book"),
  author: z.string(),
  format: z.string(),
  pages: z.number().int(),
  genre: z.string(),
});

export const ceramicSchema = baseProductSchema.extend({
  category: z.literal("Ceramic"),
  material: z.string(),
  color: z.string(),
  dishwasherSafe: z.boolean(),
  setPieces: z.number().int(),
});

export const kitchenSchema = baseProductSchema.extend({
  category: z.literal("Kitchen"),
  material: z.string(),
  capacity: z.string(),
  powerWatts: z.number().int(),
  warrantyYears: z.number().int(),
});

export const headphonesSchema = baseProductSchema.extend({
  category: z.literal("Headphones"),
  connectivity: z.string(),
  noiseCancellation: z.boolean(),
  batteryHours: z.number(),
  driverSizeMm: z.number(),
});

export const furnitureSchema = baseProductSchema.extend({
  category: z.literal("Furniture"),
  material: z.string(),
  dimensions: z.string(),
  assemblyRequired: z.boolean(),
  weightKg: z.number(),
});

export const sportswearSchema = baseProductSchema.extend({
  category: z.literal("Sportswear"),
  size: z.string(),
  fabric: z.string(),
  gender: z.string(),
  activity: z.string(),
});

export const cameraSchema = baseProductSchema.extend({
  category: z.literal("Camera"),
  megapixels: z.number(),
  sensorType: z.string(),
  videoResolution: z.string(),
  interchangeableLens: z.boolean(),
});

export const applianceSchema = baseProductSchema.extend({
  category: z.literal("Appliance"),
  energyRating: z.string(),
  capacity: z.string(),
  powerWatts: z.number().int(),
  smartEnabled: z.boolean(),
});

export const productSchema = z.discriminatedUnion("category", [
  laptopSchema,
  tvSchema,
  bookSchema,
  ceramicSchema,
  kitchenSchema,
  headphonesSchema,
  furnitureSchema,
  sportswearSchema,
  cameraSchema,
  applianceSchema,
]);

export type Product = z.infer<typeof productSchema>;

export const productsFileSchema = z.array(productSchema);

export const parsedQueryFiltersSchema = z.object({
  brand: z.string().nullable(),
  category: z.enum(CATEGORIES).nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
});

export const QUERY_INTENTS = ["search", "count", "list"] as const;
export type QueryIntent = (typeof QUERY_INTENTS)[number];

/** OpenAI structured output: no `.optional()` — use `.nullable()` instead. */
export const parsedQueryStructuredSchema = z.object({
  intent: z.enum(QUERY_INTENTS).nullable(),
  semanticQuery: z.string(),
  keywordQuery: z.string(),
  filters: parsedQueryFiltersSchema.nullable(),
});

export type ParsedQuery = {
  intent: QueryIntent;
  semanticQuery: string;
  keywordQuery: string;
  filters?: QueryFilters;
};

export type QueryFilters = {
  brand?: string;
  category?: (typeof CATEGORIES)[number];
  priceMin?: number;
  priceMax?: number;
};

export function normalizeStructuredParsedQuery(
  raw: z.infer<typeof parsedQueryStructuredSchema>,
): ParsedQuery {
  const result: ParsedQuery = {
    intent: raw.intent ?? "search",
    semanticQuery: raw.semanticQuery,
    keywordQuery: raw.keywordQuery,
  };

  if (!raw.filters) {
    if (!result.keywordQuery.trim()) {
      result.keywordQuery = result.semanticQuery;
    }
    return result;
  }

  const filters: QueryFilters = {};
  if (raw.filters.brand) filters.brand = raw.filters.brand;
  if (raw.filters.category) filters.category = raw.filters.category;
  if (raw.filters.priceMin != null && raw.filters.priceMin > 0) {
    filters.priceMin = raw.filters.priceMin;
  }
  if (raw.filters.priceMax != null && raw.filters.priceMax > 0) {
    filters.priceMax = raw.filters.priceMax;
  }

  if (Object.keys(filters).length > 0) {
    result.filters = filters;
  }

  if (!result.keywordQuery.trim()) {
    result.keywordQuery = [filters.brand, filters.category]
      .filter(Boolean)
      .join(" ") || result.semanticQuery;
  }

  return result;
}

/** @deprecated Use parsedQueryStructuredSchema for LLM parsing. */
export const parsedQuerySchema = z.object({
  semanticQuery: z.string(),
  keywordQuery: z.string(),
  filters: z
    .object({
      brand: z.string().optional(),
      category: z.enum(CATEGORIES).optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
    })
    .optional(),
});
