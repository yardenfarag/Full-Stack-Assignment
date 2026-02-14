# Database Reference

PostgreSQL 16, running in Docker on `localhost:5432`.

**Connection string:** `postgresql://candidate:assignment@localhost:5432/ad_platform`

The schema is defined in `prisma/schema.prisma` and pushed to the database by `./setup.sh`.

---

## Tables

### `Campaign`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `campaign_id` | `TEXT` | **PK** | Unique identifier (e.g., `camp_0001`) |
| `campaign_name` | `TEXT` | NOT NULL | Human-readable name |
| `status` | `TEXT` | NOT NULL | `"active"` or `"inactive"` |
| `campaign_objective` | `TEXT` | NOT NULL | One of: `AWARENESS`, `TRAFFIC`, `ENGAGEMENT`, `LEADS`, `SALES` |

---

### `Ad`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `ad_id` | `TEXT` | **PK** | Unique identifier (e.g., `ad_00001`) |
| `campaign_id` | `TEXT` | **FK** -> `Campaign.campaign_id` | Parent campaign |
| `creative_id` | `TEXT` | **FK** -> `Creative.creative_id` | Associated creative asset |
| `date_start` | `TEXT` | NOT NULL | Start date (`YYYY-MM-DD`) |
| `date_end` | `TEXT` | NOT NULL | End date (`YYYY-MM-DD`) |
| `name` | `TEXT` | NOT NULL | Ad name |
| `description` | `TEXT` | NOT NULL | Ad description copy |
| `status` | `TEXT` | NOT NULL | `"active"` or `"inactive"` |

---

### `Creative`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `creative_id` | `TEXT` | **PK** | Unique identifier (e.g., `cr_0001`) |
| `creative_type` | `TEXT` | NOT NULL | `"image"` or `"video"` |
| `thumbnail_url` | `TEXT` | NOT NULL | URL to thumbnail image |

---

### `Insight`

Daily performance metrics, one row per ad per day.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `insight_id` | `TEXT` | **PK** | Unique identifier (e.g., `ins_000001`) |
| `date` | `TEXT` | NOT NULL | Date of the metric (`YYYY-MM-DD`) |
| `ad_id` | `TEXT` | **FK** -> `Ad.ad_id` | Associated ad |
| `campaign_id` | `TEXT` | **FK** -> `Campaign.campaign_id` | Associated campaign |
| `impressions` | `INTEGER` | NOT NULL | Number of times the ad was shown |
| `clicks` | `INTEGER` | NOT NULL | Number of clicks |
| `spend` | `DOUBLE PRECISION` | NOT NULL | Amount spent in USD |
| `conversions` | `INTEGER` | NOT NULL | Number of conversions |
| `reach` | `INTEGER` | NOT NULL | Unique users who saw the ad |
| `video_views` | `INTEGER` | NOT NULL | Number of video views |
| `leads` | `INTEGER` | NOT NULL | Number of leads generated |
| `conversion_value` | `DOUBLE PRECISION` | NOT NULL | Revenue/value from conversions (USD) |

---

## Relationships

```
Campaign (1) ──▶ (N) Ad (N) ──▶ (1) Creative
                     │
                     ▼
                (N) Insight (daily)
```

- A **Campaign** has many **Ads** and many **Insights**
- An **Ad** belongs to one **Campaign** and one **Creative**, and has many **Insights**
- A **Creative** has many **Ads**
- An **Insight** belongs to one **Ad** and one **Campaign**
