# Hybrid RAG E-commerce Search

Next.js demo of **hybrid retrieval** over a synthetic catalog of 1,000 products:

- **Semantic search** (OpenAI embeddings + Chroma) on product descriptions
- **Metadata filtering** (brand, category, price) via Chroma `where`
- **Keyword search** (BM25) on structured specs
- **RRF fusion** of dense + sparse lists
- **Cross-encoder rerank** (Cohere Rerank API) before UI ranking and optional summaries

## Prerequisites

- Node.js 20+
- `OPENAI_API_KEY` (embeddings, query parsing, summaries)
- `COHERE_API_KEY` (optional but recommended for reranking; set `RERANK_ENABLED=false` to skip)

## Setup

```bash
cp .env.example .env.local
# edit .env.local with your keys

npm install
npm run generate:data

# Terminal 1 — local Chroma server (persists to data/chroma/)
npm run chroma:server

# Terminal 2
npm run ingest
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Example queries

| Query | What it exercises |
|-------|-------------------|
| `ceramic vase hand painted` | Semantic description search |
| `Samsung TV 55 inch 4K` | BM25 specs + brand/category |
| `books under 500` | Price metadata filter |
| `Dell laptops under 85000 with 16GB RAM` | Filters + keyword + semantic |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run generate:data` | Write `data/products.json` (1000 SKUs) |
| `npm run chroma:server` | Start local Chroma HTTP server on port 8000 |
| `npm run ingest` | Rebuild Chroma collection (server must be running) |
| `npm run dev` | Start the search UI |

## Architecture notes

- Catalog source of truth: [`data/products.json`](data/products.json)
- Chroma **JS v3** talks to a running server (`npm run chroma:server`); vectors persist under `data/chroma/`
- BM25 index is rebuilt in memory from products on server start
- Phase 2 (not implemented): Langfuse tracing, eval datasets, chat UI

## Environment

See [`.env.example`](.env.example) for tunables (`K_RETRIEVE`, `K_FINAL`, hybrid weights, etc.).
