import fs from "fs";
import { config } from "@/lib/config";
import { productsFileSchema, type Product } from "@/lib/products/schema";

let cachedProducts: Product[] | null = null;
let cachedById: Map<string, Product> | null = null;

export function loadProducts(): Product[] {
  if (cachedProducts) return cachedProducts;

  if (!fs.existsSync(config.productsPath)) {
    throw new Error(
      `Missing ${config.productsPath}. Run npm run generate:data first.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(config.productsPath, "utf-8"));
  cachedProducts = productsFileSchema.parse(raw);
  cachedById = new Map(cachedProducts.map((p) => [p.id, p]));
  return cachedProducts;
}

export function getProductById(id: string): Product | undefined {
  loadProducts();
  return cachedById?.get(id);
}

export function getProductMap(): Map<string, Product> {
  loadProducts();
  return cachedById ?? new Map();
}
