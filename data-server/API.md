# Data Server API Reference

- Base URL: `http://localhost:3001`
- All endpoints are prefixed with `/api`

## General Behavior

- Every response from the server is subject to a simulated latency of approximately 5 seconds. This applies to all successful responses across all endpoints.
- The server may randomly return errors on any request, regardless of how many requests you have made. Roughly 10% of requests will fail with a `500 Internal Server Error`, and roughly 5% will fail with a `429 Too Many Requests`. These are probabilistic and not tied to actual request volume.
- A `500` error response looks like:
  - `{ "error": "Internal Server Error", "message": "An unexpected error occurred. Please retry your request." }`
- A `429` error response looks like:
  - `{ "error": "Rate Limit Exceeded", "message": "Too many requests. Please wait before retrying.", "retryAfterMs": 1000 }`

## Pagination

- All endpoints use numeric page-based pagination
- Each page returns up to 100 rows
- Pass `?page=N` to request a specific page (1-indexed). If omitted, page 1 is returned.
- The response includes `totalPages` so you know the full extent of the dataset and can request any page directly
- Response shape for all endpoints:
  - `data` — an array of records for the requested page
  - `pagination.page` — the current page number
  - `pagination.pageSize` — the number of rows per page (always 100)
  - `pagination.totalPages` — the total number of pages available for this dataset

## Endpoints

### GET /api/campaigns

Returns campaign definitions.

- Query parameters:
  - `page` (number, optional) — page number to retrieve

- Each record contains:
  - `campaign_id` — unique identifier, e.g. `"camp_0001"`
  - `campaign_name` — human-readable name
  - `status` — either `"active"` or `"inactive"`
  - `campaign_objective` — one of `"AWARENESS"`, `"TRAFFIC"`, `"ENGAGEMENT"`, `"LEADS"`, or `"SALES"`

### GET /api/ads

Returns ad definitions. Supports filtering by campaign and date range.

- Query parameters:
  - `page` (number, optional) — page number to retrieve
  - `campaignIds` (string, optional) — comma-separated campaign IDs to filter by, e.g. `"camp_0001,camp_0002"`
  - `dateFrom` (string, optional) — ISO date; excludes ads that ended before this date
  - `dateTo` (string, optional) — ISO date; excludes ads that started after this date

- Each record contains:
  - `ad_id` — unique identifier, e.g. `"ad_00001"`
  - `campaign_id` — the parent campaign
  - `creative_id` — the linked creative asset
  - `date_start` — start date in `YYYY-MM-DD` format
  - `date_end` — end date in `YYYY-MM-DD` format
  - `name` — ad name
  - `description` — ad description
  - `status` — either `"active"` or `"inactive"`

### GET /api/creatives

Returns creative asset metadata.

- Query parameters:
  - `page` (number, optional) — page number to retrieve

- Each record contains:
  - `creative_id` — unique identifier, e.g. `"cr_0001"`
  - `creative_type` — either `"image"` or `"video"`
  - `thumbnail_url` — URL to the thumbnail image

### GET /api/insights

Returns daily performance metrics. Supports filtering by campaign, ad, and date range.

- Query parameters:
  - `page` (number, optional) — page number to retrieve
  - `campaignIds` (string, optional) — comma-separated campaign IDs
  - `adIds` (string, optional) — comma-separated ad IDs
  - `dateFrom` (string, optional) — ISO date, inclusive; excludes records before this date
  - `dateTo` (string, optional) — ISO date, inclusive; excludes records after this date

- Each record contains:
  - `insight_id` — unique identifier, e.g. `"ins_000001"`
  - `date` — the date for this metric row, in `YYYY-MM-DD` format
  - `ad_id` — the ad this metric belongs to
  - `campaign_id` — the campaign this metric belongs to
  - `impressions` — number of impressions
  - `clicks` — number of clicks
  - `spend` — amount spent (numeric)
  - `conversions` — number of conversions
  - `reach` — number of unique users reached
  - `video_views` — number of video views
  - `leads` — number of leads generated
  - `conversion_value` — revenue/value from conversions (numeric)
