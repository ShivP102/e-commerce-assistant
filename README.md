# Hybrid RAG E-commerce Search

Next.js demo of **hybrid retrieval** over a synthetic catalog of 1,000 products:

- **Semantic search** (OpenAI embeddings + Chroma) on product descriptions
- **Metadata filtering** (brand, category, price) via Chroma `where` and in-memory catalog filters
- **Keyword search** (BM25) on structured specs
- **RRF fusion** of dense + sparse lists
- **Cross-encoder rerank** (Cohere Rerank API) before UI ranking
- **Query intent routing**: discovery **search** vs **count** / **list** with **exact catalog counts** from `products.json`

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

## End-to-end flow

**Legend:** blue = client · indigo = API · amber = parsing · **gold (thick border) = intent routing** · green = exact catalog · purple = hybrid retrieval · pink = response

```mermaid
flowchart TB
  subgraph S1 ["1. User Search UI"]
    direction LR
    UI[Enter query and submit]
  end

  subgraph S2 ["2. POST /api/search"]
    direction LR
    API[Search route handler]
  end

  subgraph S3 ["3. Query understanding — intent routing"]
    direction TB
    IntentHeur[Phrase heuristics - how many, list all]
    Parse[Structured LLM parse - filters and queries]
    Hints[Price regex hints]
    Intent["Intent routing - search, count, or list"]
    IntentHeur --> Intent
    Parse --> Hints --> Intent
  end

  subgraph S4 ["4. Parallel execution"]
    direction TB
    subgraph S4lanes [" "]
      direction LR
      subgraph S4a ["Catalog path"]
        direction TB
        Filter[Filter products.json]
        Total["totalMatching (exact count)"]
        Filter --> Total
      end
      subgraph S4b ["Hybrid RAG path"]
        direction TB
        Dense[Chroma semantic]
        Sparse[BM25 on specs]
        Fuse[RRF fuse by product id]
        Rank[Cohere rerank]
        Items[Top K for grid]
        Dense --> Fuse
        Sparse --> Fuse
        Fuse --> Rank --> Items
      end
    end
    S4Join(("Both paths complete"))
    Total --> S4Join
    Items --> S4Join
  end

  subgraph S5 ["5. Assemble JSON response"]
    direction TB
    Merge[Merge aggregate + products + retrieval]
    Summary[Optional grounded summary]
    Merge --> Summary
  end

  subgraph S6 ["6. Search UI update"]
    direction TB
    Banner[Count / intent banner]
    Cards[Product cards]
    Debug[Debug strip]
    Banner --> Cards --> Debug
  end

  UI --> API
  API --> Parse
  Intent --> Filter
  Intent --> Dense
  Intent --> Sparse
  S4Join --> Merge
  Summary --> Banner

  classDef user fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef api fill:#E0E7FF,stroke:#4F46E5,color:#312E81
  classDef parse fill:#FEF3C7,stroke:#D97706,color:#78350F
  classDef intent fill:#FDE68A,stroke:#B45309,color:#78350F,stroke-width:3px
  classDef catalog fill:#D1FAE5,stroke:#059669,color:#064E3B
  classDef rag fill:#EDE9FE,stroke:#7C3AED,color:#4C1D95
  classDef out fill:#FCE7F3,stroke:#DB2777,color:#831843
  classDef join fill:#F3F4F6,stroke:#6B7280,color:#374151

  class UI,Banner,Cards,Debug user
  class API api
  class Parse,Hints parse
  class Intent,IntentHeur intent
  class Filter,Total catalog
  class Dense,Sparse,Fuse,Rank,Items rag
  class Merge,Summary out
  class S4Join join
```

**Placement:** steps **1 → 6** stack top to bottom. Step **4** shows **two parallel lanes** (green catalog vs purple hybrid), rejoining at **Both paths complete** before step **5**.

### How intents behave

| Intent | Trigger examples | Catalog | Product grid |
|--------|------------------|---------|--------------|
| **search** | “Dell laptop for work”, “ceramic vase” | Optional filter count shown | Top-K **relevance** (hybrid + rerank) |
| **count** | “how many laptops above 100000” | **Exact** `totalMatching` on filtered JSON | Top-K **suggestions** only (not full set) |
| **list** | “list all TVs under 50000” | Exact total | Top-K ranked slice |

**Important:** Hybrid search returns **ranked samples** (`K_FINAL`, default 10). The **`aggregate.totalMatching`** field is the authoritative count for filter questions. Summaries for count/list intents prepend that fact so the LLM does not invent a different number.

## Example queries

| Query | What it exercises |
|-------|-------------------|
| `ceramic vase hand painted` | Semantic description search |
| `Samsung TV 55 inch 4K` | BM25 specs + brand/category |
| `books under 500` | Price metadata filter + catalog count |
| `Dell laptops under 85000 with 16GB RAM` | Filters + keyword + semantic |
| `How many laptops are available above 100000 for gifting?` | **count** intent + exact catalog total + top-K gifting suggestions |

## API response shape

```json
{
  "parsed": { "intent": "count", "semanticQuery": "...", "filters": { ... } },
  "aggregate": {
    "intent": "count",
    "totalMatching": 42,
    "productsReturned": 10
  },
  "products": [ "... top ranked ..." ],
  "retrieval": { "... hybrid debug ..." },
  "summary": "..."
}
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run generate:data` | Write `data/products.json` (1000 SKUs) |
| `npm run chroma:server` | Start local Chroma HTTP server on port 8000 |
| `npm run ingest` | Rebuild Chroma collection (server must be running) |
| `npm run dev` | Start the search UI |

## Architecture notes

- **Catalog source of truth:** [`data/products.json`](data/products.json) — counts and display fields
- **Chroma:** semantic index over descriptions only; requires `npm run chroma:server`
- **BM25:** rebuilt in memory from products on each search (filtered subset)
- **Price phrases:** regex backup in [`src/lib/retrieval/price-filter-hints.ts`](src/lib/retrieval/price-filter-hints.ts) for “above/under”
- **Phase 2 (not implemented):** Langfuse tracing, eval datasets, full chat UI, paginated list-all API

## Environment

See [`.env.example`](.env.example) for tunables (`K_RETRIEVE`, `K_FINAL`, `K_SUMMARY`, hybrid weights, etc.).
