# Backend, Source Management, Admin, and Data Integration Plan

This document breaks Milestone 2 into practical implementation steps so the site can move from mock data to reliable daily production data.

---

## 1) Core backend architecture (first decisions)

### 1.1 Choose your stack
A practical default:
- **API server**: Node.js + TypeScript + Fastify (or Express)
- **Database**: PostgreSQL
- **Queue/scheduler**: BullMQ + Redis (or managed scheduler like GitHub Actions/Cloud Scheduler + cron endpoint)
- **Caching**: Redis
- **ORM**: Prisma or Drizzle

### 1.2 Define service boundaries
Create clear internal modules (one codebase is fine at this size):
- `news-ingestion`
- `news-scoring`
- `market-integration` (Polymarket + Kalshi)
- `trends-integration`
- `stocks-integration`
- `admin-config`
- `public-api`

### 1.3 Define daily pipeline timing
- Every day at fixed UTC time:
  1. Pull stories from configured sources.
  2. Deduplicate and normalize.
  3. Score by keyword relevance + freshness + source quality.
  4. Save top 10 per keyword set.
  5. Refresh trends/markets/stocks snapshots.
  6. Publish latest snapshot for frontend.

---

## 2) Data model you should set up first

Use this as your initial schema outline.

### 2.1 Admin/config tables
- `keywords`
  - `id`, `term`, `enabled`, `weight`, `created_at`, `updated_at`
- `sources`
  - `id`, `name`, `base_url`, `rss_url`, `api_provider`, `quality_score`, `enabled`
- `source_keyword_rules`
  - relation table linking which sources to prioritize for which keywords

### 2.2 News tables
- `articles`
  - `id`, `external_id`, `source_id`, `title`, `url`, `published_at`, `author`, `raw_content`, `summary`, `language`
- `article_scores`
  - `id`, `article_id`, `keyword_id`, `relevance_score`, `freshness_score`, `source_score`, `final_score`, `scored_at`
- `daily_rankings`
  - `id`, `ranking_date`, `keyword_id`, `article_id`, `rank`, `final_score`

### 2.3 Market/trend/stock tables
- `prediction_contracts`
  - `id`, `platform` (`polymarket|kalshi`), `external_contract_id`, `title`, `url`, `status`, `tags`
- `prediction_snapshots`
  - `id`, `contract_id`, `captured_at`, `yes_price`, `no_price`, `yes_change_24h`, `no_change_24h`, `volume`
- `trend_snapshots`
  - `id`, `keyword_id`, `captured_at`, `interest_value`
- `stock_snapshots`
  - `id`, `ticker`, `captured_at`, `price`, `change_pct`, `volume`

### 2.4 Operability tables
- `ingestion_runs`
  - run status, counts, errors, duration
- `integration_errors`
  - source/provider errors for retries + alerting

---

## 3) News ingestion: APIs and approach

You have two choices:

## Option A (fast start): aggregator API
Use one provider first, then graduate to direct-source ingestion later.

Candidate APIs:
- **NewsAPI** (`/v2/everything`) – easy keyword querying
- **GNews** – simple and affordable
- **The News API** – broad source coverage

What to implement:
1. Query by active keywords (`AI`, `NVIDIA`, etc.).
2. Restrict by language/date/source where possible.
3. Normalize into `articles` table.
4. Hash canonical URL/title to deduplicate.

## Option B (more control): RSS + selective source APIs
- Pull RSS feeds from trusted sources (Reuters, FT, etc. where permitted).
- Add source-specific connectors only for high-value sources.

---

## 4) Scoring/ranking logic (backend)

Implement deterministic scoring first, then add AI scoring later.

### 4.1 Suggested formula
`final_score = 0.5 * relevance + 0.3 * freshness + 0.2 * source_quality`

- **relevance (0-100)**: keyword/tfidf/embedding similarity
- **freshness (0-100)**: decay by hours since publish
- **source_quality (0-100)**: admin-assigned baseline

### 4.2 Freshness example
- 0–6h: 100
- 6–24h: 85
- 1–2 days: 65
- 2–3 days: 45
- >3 days: 20

### 4.3 AI summary (when ready)
Use an LLM call after article extraction:
- Input: title + extracted body
- Output: 2–3 sentence factual summary
- Store in `articles.summary`
- Add caching so unchanged article URLs are not re-summarized

---

## 5) Source management + admin steps

Create a minimal admin UI/API for non-developer configuration.

### 5.1 Admin API endpoints
- `GET /admin/keywords`
- `POST /admin/keywords`
- `PATCH /admin/keywords/:id`
- `GET /admin/sources`
- `POST /admin/sources`
- `PATCH /admin/sources/:id`
- `POST /admin/recompute-rankings?date=YYYY-MM-DD`

### 5.2 Admin features to prioritize
1. Add/remove keywords.
2. Enable/disable sources.
3. Set source quality score.
4. Trigger backfill for a date range.
5. View ingestion errors.

### 5.3 Auth for admin
- Start with password + JWT/session.
- Move to OAuth (Google/GitHub) if needed.
- Require RBAC role `admin`.

---

## 6) Polymarket and Kalshi integration

## 6.1 Polymarket
Use their market/event endpoints (commonly via Gamma/market APIs depending on current docs).

Implementation steps:
1. Fetch active markets filtered by tags/keywords.
2. Map contract names to your keyword taxonomy.
3. Store normalized contracts in `prediction_contracts`.
4. Store periodic price snapshots in `prediction_snapshots`.

## 6.2 Kalshi
Use Kalshi market/event endpoints for active contracts.

Implementation steps:
1. Pull active events/markets.
2. Filter by topic keywords.
3. Normalize YES/NO pricing fields.
4. Compute 24h change from previous snapshots.

### 6.3 Unified API output for frontend
Create one endpoint:
- `GET /api/v1/markets?keywords=AI,NVIDIA`

Return merged, normalized objects:
- `platform`, `contract`, `yesPrice`, `noPrice`, `yesChange24h`, `noChange24h`, `url`, `updatedAt`

---

## 7) Google Trends integration

Google Trends has no official public API, so use one of:
- `serpapi` Google Trends endpoint (paid but stable)
- a maintained community wrapper (more fragile)

Recommended production approach: **SerpAPI** for reliability.

Implementation steps:
1. Query each active keyword daily/hourly.
2. Parse timeline interest values.
3. Save into `trend_snapshots`.
4. Provide sparklines through:
   - `GET /api/v1/trends?keyword=AI&range=30d`

---

## 8) Stock price integration

Easy APIs:
- **Twelve Data** (simple time-series endpoints)
- **Alpha Vantage** (popular; rate limits)
- **Polygon** (strong for scale)

Implementation steps:
1. Maintain `tracked_tickers` config (NVDA, MSFT, AMD, etc.).
2. Pull quote + recent timeseries.
3. Save to `stock_snapshots`.
4. Serve to frontend:
   - `GET /api/v1/stocks?tickers=NVDA,MSFT,AMD&range=5d`

---

## 9) Public API contract for the frontend

Expose a single dashboard payload so frontend makes one request.

- `GET /api/v1/dashboard`

Response shape:
- `generatedAt`
- `keywords`
- `topNews` (top 10 with score and summary)
- `markets` (polymarket + kalshi normalized)
- `trends` (sparkline arrays)
- `stocks` (price + sparkline arrays)

This simplifies frontend rendering and avoids many parallel API calls.

---

## 10) Jobs, retries, and observability

### 10.1 Scheduled jobs
- `daily_news_pipeline` (main ranking)
- `markets_refresh` (e.g., every 5–15 min)
- `trends_refresh` (e.g., every 1–4 h)
- `stocks_refresh` (e.g., every 5–15 min market hours)

### 10.2 Retry policy
- exponential backoff for transient 429/5xx
- dead-letter queue for persistent failures

### 10.3 Monitoring
- log each run with counts + durations
- alert if a provider has no new data beyond threshold
- health endpoints:
  - `GET /health/live`
  - `GET /health/ready`

---

## 11) Security, compliance, and quality controls

- Store API keys in secret manager or environment variables.
- Rate-limit public endpoints.
- Add basic abuse controls and input validation.
- Respect source/provider terms for content storage and display.
- Keep citation/source URL on every article shown to users.

---

## 12) Suggested execution order (practical roadmap)

### Phase 1 (1–2 weeks): foundation
1. Backend skeleton + DB schema + migrations.
2. Admin CRUD for keywords/sources.
3. News ingestion from one provider.
4. Deterministic scoring + daily top 10 endpoint.

### Phase 2 (1 week): market/trend/stock connectors
1. Polymarket + Kalshi normalized ingestion.
2. Google Trends connector.
3. Stock connector.
4. Unified `/api/v1/dashboard` payload.

### Phase 3 (1 week): hardening
1. Queue-based jobs + retries.
2. Observability + error dashboard.
3. Caching + performance tuning.
4. Add AI summarization step with budget controls.

### Phase 4 (ongoing): quality upgrades
1. Better relevance scoring (embeddings).
2. Source reputation calibration.
3. Duplicate clustering across publications.
4. Backtesting score quality vs user engagement.

---

## 13) Minimum API checklist to start building now

1. **News provider**: NewsAPI or GNews.
2. **Markets**: Polymarket + Kalshi REST endpoints.
3. **Trends**: SerpAPI Google Trends endpoint.
4. **Stocks**: Twelve Data or Alpha Vantage.
5. **LLM summarization** (later): OpenAI/Anthropic/other model provider.

If you want, next step can be generating a concrete `openapi.yaml` and SQL migration files for these endpoints/tables so implementation can begin immediately.
