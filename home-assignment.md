# Fullstack Home Assignment: Ad Performance Dashboard

## Overview

Build a fullstack application that displays advertising performance data in a configurable dashboard table.

You are given:
- A **data server** (port 3001) — an external API that serves advertising data. **Do not modify it.**
- An empty **PostgreSQL** database (port 5432) — schema already created via Prisma.
- A scaffolded **server** (port 3000) — Fastify + Prisma, no routes implemented.
- A scaffolded **client** (port 5173) — React + Vite + Tailwind + shadcn/ui, no components implemented.

**Time estimate:** 4-6 hours
**Stack:** React, Fastify, Prisma, PostgreSQL, TypeScript

---

## Make It Yours

This assignment is intentionally open-ended in terms of design and implementation. We give you the requirements and the data — how you build it is up to you.

- **Architecture, patterns, and structure** are your call. Organize the code the way you would in a real project.
- **UI/UX design** is yours to own. There are no mockups. Build something you'd be proud to demo.
- **Add any libraries** you find useful — state management, table components, data fetching, whatever you'd reach for in practice.
- **You may modify the Prisma schema** if you want to add indexes, change types, or restructure. The provided schema is a starting point, not a constraint.
- **Implementation decisions** — when the spec doesn't prescribe a specific approach, choose what you think is best and be ready to explain why.

The dashboard should reflect your engineering sensibility. We're looking at how you think about problems, not just whether the features work.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Data Server     │────▶│  Your Server     │────▶│  Your Client │
│  (DO NOT MODIFY) │     │  (Fastify+Prisma) │     │ (React+Vite) │
│  Port 3001       │     │  Port 3000        │     │ Port 5173    │
└─────────────────┘     └───────┬──────────┘     └──────────────┘
                                │
                         ┌──────▼──────┐
                         │  PostgreSQL  │
                         │  Port 5432   │
                         └─────────────┘
```

---

## Setup

```bash
./setup.sh

# Then run each in a separate terminal:
cd data-server && npm run dev
cd server && npm run dev
cd client && npm run dev
```

---

## References

- **Data Server API:** See [`data-server/API.md`](data-server/API.md) for endpoint documentation, pagination, and error behavior.
- **Database Schema:** See [`server/DATABASE.md`](server/DATABASE.md) for table definitions and relationships.
- **Prisma Schema:** See [`server/prisma/schema.prisma`](server/prisma/schema.prisma) for the ORM model definitions.

---

## Part 1: Data Ingestion

Fetch all data from the data server and store it in PostgreSQL.

The data server API documentation is in `data-server/API.md`. Read it carefully — it describes the pagination model, response latency, and error behavior you'll need to handle.

The dashboard should include a way to trigger data sync from the external API, and the UI must reflect ingestion progress in real time — showing how many rows have been fetched so far (row count only, the data itself doesn't need to update live, but think about a way to make sure the user understands that data is being synced, or done syncing, and allow the user to look at the data, partial as it may be, during the fetching process), updating live (or near-live), per entity type.

Re-sync behavior (what happens when the user triggers sync again) is your design decision — document your choice.

---

## Part 2: Backend API

Build the following endpoints on your server (port 3000):

### `POST /api/performance`

Returns aggregated performance data with filtering, sorting, and pagination.

**Request body:**
```typescript
interface PerformanceRequest {
  grouping: "campaign" | "ad";
  filters: {
    dateRange: {
      from: string;  // YYYY-MM-DD
      to: string;    // YYYY-MM-DD
    };
    status?: "active" | "inactive";
    campaignObjective: string;
    search?: string;  // free-text search against names (campaign name, ad name)
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  columns: string[];  // IDs of requested columns — the server should only compute and return these
}
```

**Response:**
```typescript
interface PerformanceResponse {
  data: Record<string, any>[];
  meta: {
    totalRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

**Aggregation:**

The dashboard table should show aggregated values, not raw daily rows. Metrics (impressions, clicks, spend, etc.) are summed across the date range.

- `grouping = "ad"` — each row = one ad. Sum all daily metrics for that ad within the date range. Include linked campaign and creative info.
- `grouping = "campaign"` — each row = one campaign. Sum all daily metrics across all ads for that campaign within the date range.

**KPIs — per-objective:**

Each campaign has an objective. The relevant KPIs depend on the objective:

| Objective | KPI 1 | Formula | Format | KPI 2 | Formula | Format |
|-----------|-------|---------|--------|-------|---------|--------|
| AWARENESS | CPM | (spend / impressions) × 1000 | $12.34 | CPR | (spend / reach) × 1000 | $8.56 |
| TRAFFIC | CTR | (clicks / impressions) × 100 | 2.45% | CPC | spend / clicks | $0.83 |
| ENGAGEMENT | View Rate | (video_views / impressions) × 100 | 14.2% | CPV | spend / video_views | $0.12 |
| LEADS | CPL | spend / leads | $15.00 | Lead Conv. Rate | (leads / clicks) × 100 | 3.1% |
| SALES | ROAS | conversion_value / spend | 2.4x | CPA | spend / conversions | $8.25 |

**KPI aggregation methodology:**

KPIs should be computed per day first, then aggregated over the date range:
- **Ad level:** Average the daily KPI values across all days in the range for that ad.
- **Campaign level:** Take the per-ad average KPIs and compute a weighted average across all ads in the campaign, weighted by each ad's total spend in the date range.

Handle division by zero gracefully (return `0`).

### `GET /api/columns`

Returns available column definitions for the frontend. This should drive what the UI knows about available columns, their display names, types, and which grouping levels and objectives they apply to.

```typescript
interface ColumnsResponse {
  columns: {
    id: string;
    label: string;
    category: "info" | "metrics" | "kpi";
    type: "string" | "number" | "currency" | "percentage" | "ratio";
    availableFor: ("campaign" | "ad")[];
    objective?: "AWARENESS" | "TRAFFIC" | "ENGAGEMENT" | "LEADS" | "SALES";
      // only present for KPI columns — indicates which campaign objective this KPI belongs to
  }[];
}
```

**Expected columns:**

Info columns (category `"info"`):
- `campaign_name` — label: "Campaign", type: string, availableFor: campaign, ad
- `campaign_objective` — label: "Objective", type: string, availableFor: campaign, ad
- `status` — label: "Status", type: string, availableFor: campaign, ad
- `ad_name` — label: "Ad", type: string, availableFor: ad
- `creative_type` — label: "Creative Type", type: string, availableFor: ad

Metric columns (category `"metrics"`):
- `impressions` — type: number, availableFor: campaign, ad
- `clicks` — type: number, availableFor: campaign, ad
- `spend` — type: currency, availableFor: campaign, ad
- `conversions` — type: number, availableFor: campaign, ad
- `reach` — type: number, availableFor: campaign, ad
- `video_views` — type: number, availableFor: campaign, ad
- `leads` — type: number, availableFor: campaign, ad
- `conversion_value` — label: "Revenue", type: currency, availableFor: campaign, ad

KPI columns (category `"kpi"`, objective-specific):
- `cpm` — label: "CPM", type: currency, objective: AWARENESS
- `cpr` — label: "CPR", type: currency, objective: AWARENESS
- `ctr` — label: "CTR", type: percentage, objective: TRAFFIC
- `cpc` — label: "CPC", type: currency, objective: TRAFFIC
- `view_rate` — label: "View Rate", type: percentage, objective: ENGAGEMENT
- `cpv` — label: "CPV", type: currency, objective: ENGAGEMENT
- `cpl` — label: "CPL", type: currency, objective: LEADS
- `lead_conv_rate` — label: "Lead Conv. Rate", type: percentage, objective: LEADS
- `roas` — label: "ROAS", type: ratio, objective: SALES
- `cpa` — label: "CPA", type: currency, objective: SALES

All KPI columns are availableFor both campaign and ad grouping levels.

---

## Part 3: Frontend

Build a React dashboard. The core features:

1. **Data sync trigger** — a way to initiate data ingestion from the data server, with live progress display showing rows fetched per entity
2. **Performance table** — displays data from `POST /api/performance`
3. **Filter bar** — date range (required — provide preset options like last 7, 14, 30, 60, 90 days and a custom range picker), campaign objective (required — must be selected before data is fetched), status (optional), text search (optional). The decision to filter in the backend or frontend is your choice.
4. **Grouping selector** — toggle between "Campaign" and "Ad" views
5. **Column selection** — let users choose which columns to display (as simple as possible, campaign objective aware multi select dropdown is enough)
6. **Pagination** — page controls, rows per page selector, row count display (backend or frontend pagination, your choice)
7. **Sorting** — click column headers to sort
8. **Loading and error states**

How you organize components, manage state, and design the interactions is up to you.

---

## Bonus (Optional)

These are ways to go further — pick any that interest you:

- Thumbnail display when grouping by ad
- Number formatting (currency, percentages, large numbers)
- Debounced search
- URL state sync
- Tests
- Anything else you think makes the dashboard better

---

## Evaluation Criteria

| Area | 
|------|
| Data ingestion 
| Backend logic & API design 
| Frontend implementation & UX 
| Code organization & architecture 
| TypeScript usage & overall polish 

---

## Submission

1. Push to a Git repository of your own, make it public
2. Include a `README.md` with:
   - Setup instructions
   - Design decisions and trade-offs you made
   - What you'd improve or do differently given more time
3. Project should run with `./setup.sh` + starting the three services

If anything is unclear, make reasonable assumptions and document them.
