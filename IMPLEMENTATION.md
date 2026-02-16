# Implementation Guide

## Setup Instructions

1. **Prerequisites:**
   - Node.js (v18 or higher)
   - Docker Desktop (must be running)

## Quick Setup

1. **Make sure Docker Desktop is running**

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```
   
   This will:
   - Start PostgreSQL in Docker
   - Install dependencies for all three services
   - Create the database connection file (`server/.env` with `DATABASE_URL`)
   - Set up the database schema
   
   **Note:** Make sure `server/.env` exists with `DATABASE_URL` after running setup. The setup script creates this automatically, but if you need to create it manually:
   ```
   DATABASE_URL="postgresql://candidate:assignment@localhost:5432/ad_platform?schema=public"
   ```

## Running the Application

Run all services with one command:

**Unix/Linux/macOS:**
```bash
./run.sh
```

**Windows (PowerShell):**
```powershell
.\run.ps1
```

Or run each service manually in separate terminals:
```bash
# Terminal 1
cd data-server && npm run dev

   # Terminal 2
   cd server && npm run dev

   # Terminal 3
   cd client && npm run dev
   ```

4. **Access the dashboard:** http://localhost:5173

---

## Design Decisions and Trade-offs

### Data Ingestion

- **Re-sync behavior:** Replace all existing data on re-sync. Ensures data consistency and avoids duplicates. Trade-off: Takes longer but guarantees clean data.
- **Real-time progress:** Server-Sent Events (SSE) for live updates. Simpler than WebSockets for one-way communication.
- **Optimizations:** Parallel fetching, batch processing (20-30 concurrent requests), bulk inserts, TRUNCATE for faster data clearing.
- **Error handling:** Retry logic with exponential backoff, handles 429 rate limits and 500 errors.

### Backend API

- **KPI calculation:** 
  - Ad level: Calculate daily KPIs, then average across date range
  - Campaign level: Weighted average of per-ad KPIs (weighted by spend)
- **Filtering:** Done server-side in database queries (date range, status, campaign objective, search)
- **Aggregation:** Done server-side (grouping by campaign/ad, summing metrics, calculating KPIs)
- **Sorting:** Done server-side in-memory after aggregation (not in database query)
- **Pagination:** Done server-side in-memory after sorting (not in database query)
- **Trade-off:** Loads all matching filtered records into memory for sorting/pagination. Could be optimized with database-level sorting/pagination for very large datasets.
- **Caching:** Performance queries cached for 5 minutes, automatically cleared on sync completion.

**Client role:** Client only manages state (filters, pagination params, sorting params) and sends them to the server. Server returns pre-processed, paginated results which the client displays directly without any additional processing.

### Frontend

- **Architecture:** Component-based with React Context for shared state, local hooks for component state
- **Client responsibilities:** Manages filter/pagination/sorting state, sends parameters to server, displays pre-processed results
- **UI:** shadcn/ui components, debounced search (500ms), clear loading/error states

---

## What I'd Improve Given More Time

1. Better Error Handling:
   - Error/Success Pop-ups
   - More granular error messages
   - Retry UI for failed syncs

2. Performance:
   - Lazy loading of table rows

3. Features:
   - Export to CSV/Excel
   - Chart visualizations
   - Column width resizing
   - Column reordering
   - Store column definitions in the database instead of hardcoding them in a file for better maintainability and dynamic configuration
   - Add a "Select All" button/checkbox to the column selector for easier bulk selection

4. UX:
   - Skeleton loaders instead of simple "Loading..." text
   - Toast notifications for actions
   - Improve the date picker to use just one input instead of separate from/to inputs



