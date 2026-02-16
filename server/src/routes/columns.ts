import { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { cache } from "../utils/cache.js";

/**
 * Returns metadata about available table columns for the performance dashboard.
 * The frontend uses this to determine which columns to show based on the current
 * grouping level (campaign vs ad) and campaign objective. KPI columns are filtered
 * by objective (AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, SALES), while info and metric
 * columns are generally available for all objectives.
 */
export async function columnsRoutes(fastify: FastifyInstance) {
  fastify.get(config.endpoints.columns, async (request, reply) => {
    // Check cache first (columns are static, cache for 1 hour)
    const cacheKey = "columns:definitions";
    const cached = cache.get(cacheKey);
    if (cached) {
      return reply.send({ columns: cached });
    }

    const columns = [
      // Info columns
      {
        id: "campaign_name",
        label: "Campaign",
        category: "info",
        type: "string",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "campaign_objective",
        label: "Objective",
        category: "info",
        type: "string",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "status",
        label: "Status",
        category: "info",
        type: "string",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "ad_name",
        label: "Ad",
        category: "info",
        type: "string",
        availableFor: ["ad"],
      },
      {
        id: "creative_type",
        label: "Creative Type",
        category: "info",
        type: "string",
        availableFor: ["ad"],
      },
      {
        id: "thumbnail_url",
        label: "Thumbnail",
        category: "info",
        type: "string",
        availableFor: ["ad"],
      },
      // Metric columns
      {
        id: "impressions",
        label: "Impressions",
        category: "metrics",
        type: "number",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "clicks",
        label: "Clicks",
        category: "metrics",
        type: "number",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "spend",
        label: "Spend",
        category: "metrics",
        type: "currency",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "conversions",
        label: "Conversions",
        category: "metrics",
        type: "number",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "reach",
        label: "Reach",
        category: "metrics",
        type: "number",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "video_views",
        label: "Video Views",
        category: "metrics",
        type: "number",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "leads",
        label: "Leads",
        category: "metrics",
        type: "number",
        availableFor: ["campaign", "ad"],
      },
      {
        id: "conversion_value",
        label: "Revenue",
        category: "metrics",
        type: "currency",
        availableFor: ["campaign", "ad"],
      },
      // KPI columns - AWARENESS
      {
        id: "cpm",
        label: "CPM",
        category: "kpi",
        type: "currency",
        availableFor: ["campaign", "ad"],
        objective: "AWARENESS",
      },
      {
        id: "cpr",
        label: "CPR",
        category: "kpi",
        type: "currency",
        availableFor: ["campaign", "ad"],
        objective: "AWARENESS",
      },
      // KPI columns - TRAFFIC
      {
        id: "ctr",
        label: "CTR",
        category: "kpi",
        type: "percentage",
        availableFor: ["campaign", "ad"],
        objective: "TRAFFIC",
      },
      {
        id: "cpc",
        label: "CPC",
        category: "kpi",
        type: "currency",
        availableFor: ["campaign", "ad"],
        objective: "TRAFFIC",
      },
      // KPI columns - ENGAGEMENT
      {
        id: "view_rate",
        label: "View Rate",
        category: "kpi",
        type: "percentage",
        availableFor: ["campaign", "ad"],
        objective: "ENGAGEMENT",
      },
      {
        id: "cpv",
        label: "CPV",
        category: "kpi",
        type: "currency",
        availableFor: ["campaign", "ad"],
        objective: "ENGAGEMENT",
      },
      // KPI columns - LEADS
      {
        id: "cpl",
        label: "CPL",
        category: "kpi",
        type: "currency",
        availableFor: ["campaign", "ad"],
        objective: "LEADS",
      },
      {
        id: "lead_conv_rate",
        label: "Lead Conv. Rate",
        category: "kpi",
        type: "percentage",
        availableFor: ["campaign", "ad"],
        objective: "LEADS",
      },
      // KPI columns - SALES
      {
        id: "roas",
        label: "ROAS",
        category: "kpi",
        type: "ratio",
        availableFor: ["campaign", "ad"],
        objective: "SALES",
      },
      {
        id: "cpa",
        label: "CPA",
        category: "kpi",
        type: "currency",
        availableFor: ["campaign", "ad"],
        objective: "SALES",
      },
    ];

    // Cache for 1 hour (3600000 ms) - columns are static
    cache.set(cacheKey, columns, 3600000);

    return reply.send({ columns });
  });
}

