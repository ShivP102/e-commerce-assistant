import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const { config } = await import("../src/lib/config");
  const { loadProducts } = await import("../src/lib/products/load-products");
  const { recreateChromaCollection, resetIndexStoreCache } = await import(
    "../src/lib/retrieval/index-store"
  );

  console.log("Loading products...");
  const products = loadProducts();
  console.log(`Validated ${products.length} products.`);

  console.log(`Ingesting into Chroma at ${config.chromaUrl}...`);
  await recreateChromaCollection();
  resetIndexStoreCache();

  console.log("Ingest complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
