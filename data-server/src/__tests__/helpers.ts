import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { campaignsRoutes } from "../routes/campaigns.js";
import { adsRoutes } from "../routes/ads.js";
import { creativesRoutes } from "../routes/creatives.js";
import { insightsRoutes } from "../routes/insights.js";
import { checkRandomError } from "../utils.js";
import type { Campaign, Ad, Creative, Insight } from "../index.js";

/**
 * Builds the Fastify app with the given data, without calling listen().
 * No random errors, no delay — tests exercise route logic in isolation.
 */
export async function buildApp(data: {
  campaigns: Campaign[];
  ads: Ad[];
  creatives: Creative[];
  insights: Insight[];
}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.decorate("data", data);

  await app.register(campaignsRoutes, { prefix: "/api" });
  await app.register(adsRoutes, { prefix: "/api" });
  await app.register(creativesRoutes, { prefix: "/api" });
  await app.register(insightsRoutes, { prefix: "/api" });

  await app.ready();
  return app;
}

/**
 * Builds the Fastify app WITH the random error hook (mirrors production index.ts).
 * No delay — we don't want tests to be slow.
 */
export async function buildAppWithRandomErrors(data: {
  campaigns: Campaign[];
  ads: Ad[];
  creatives: Creative[];
  insights: Insight[];
}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.addHook("onRequest", async (_request, reply) => {
    const result = checkRandomError();
    if (result.shouldError) {
      reply.code(result.statusCode!).send(result.body);
    }
  });

  app.decorate("data", data);

  await app.register(campaignsRoutes, { prefix: "/api" });
  await app.register(adsRoutes, { prefix: "/api" });
  await app.register(creativesRoutes, { prefix: "/api" });
  await app.register(insightsRoutes, { prefix: "/api" });

  await app.ready();
  return app;
}

// ---------------------------------------------------------------------------
// Fixture data — small, deterministic, easy to assert against
// ---------------------------------------------------------------------------

export const fixtures = {
  campaigns: [
    { campaign_id: "camp_0001", campaign_name: "Summer Sale", status: "active", campaign_objective: "TRAFFIC" },
    { campaign_id: "camp_0002", campaign_name: "Winter Push", status: "inactive", campaign_objective: "AWARENESS" },
    { campaign_id: "camp_0003", campaign_name: "Spring Boost", status: "active", campaign_objective: "SALES" },
  ] as Campaign[],

  ads: [
    { ad_id: "ad_00001", campaign_id: "camp_0001", creative_id: "cr_0001", date_start: "2025-08-01", date_end: "2025-09-15", name: "Ad Alpha", description: "Desc A", status: "active" },
    { ad_id: "ad_00002", campaign_id: "camp_0001", creative_id: "cr_0002", date_start: "2025-10-01", date_end: "2025-11-30", name: "Ad Beta", description: "Desc B", status: "inactive" },
    { ad_id: "ad_00003", campaign_id: "camp_0002", creative_id: "cr_0001", date_start: "2025-09-01", date_end: "2025-10-15", name: "Ad Gamma", description: "Desc C", status: "inactive" },
    { ad_id: "ad_00004", campaign_id: "camp_0003", creative_id: "cr_0003", date_start: "2025-12-01", date_end: "2026-01-31", name: "Ad Delta", description: "Desc D", status: "active" },
    { ad_id: "ad_00005", campaign_id: "camp_0003", creative_id: "cr_0002", date_start: "2025-08-15", date_end: "2025-09-30", name: "Ad Epsilon", description: "Desc E", status: "active" },
  ] as Ad[],

  creatives: [
    { creative_id: "cr_0001", creative_type: "image", thumbnail_url: "https://example.com/1.png" },
    { creative_id: "cr_0002", creative_type: "video", thumbnail_url: "https://example.com/2.png" },
    { creative_id: "cr_0003", creative_type: "image", thumbnail_url: "https://example.com/3.png" },
  ] as Creative[],

  insights: [
    { insight_id: "ins_000001", date: "2025-08-01", ad_id: "ad_00001", campaign_id: "camp_0001", impressions: 1000, clicks: 50, spend: 25.0, conversions: 5, reach: 800, video_views: 100, leads: 2, conversion_value: 45.0 },
    { insight_id: "ins_000002", date: "2025-08-02", ad_id: "ad_00001", campaign_id: "camp_0001", impressions: 1200, clicks: 60, spend: 30.0, conversions: 6, reach: 900, video_views: 120, leads: 3, conversion_value: 55.0 },
    { insight_id: "ins_000003", date: "2025-09-01", ad_id: "ad_00003", campaign_id: "camp_0002", impressions: 800, clicks: 40, spend: 20.0, conversions: 4, reach: 600, video_views: 80, leads: 0, conversion_value: 12.0 },
    { insight_id: "ins_000004", date: "2025-10-01", ad_id: "ad_00002", campaign_id: "camp_0001", impressions: 1500, clicks: 75, spend: 37.5, conversions: 8, reach: 1100, video_views: 150, leads: 4, conversion_value: 70.0 },
    { insight_id: "ins_000005", date: "2025-12-15", ad_id: "ad_00004", campaign_id: "camp_0003", impressions: 2000, clicks: 100, spend: 50.0, conversions: 10, reach: 1500, video_views: 200, leads: 5, conversion_value: 120.0 },
    { insight_id: "ins_000006", date: "2026-01-10", ad_id: "ad_00004", campaign_id: "camp_0003", impressions: 2500, clicks: 125, spend: 62.5, conversions: 12, reach: 1800, video_views: 250, leads: 6, conversion_value: 150.0 },
    { insight_id: "ins_000007", date: "2025-08-20", ad_id: "ad_00005", campaign_id: "camp_0003", impressions: 900, clicks: 45, spend: 22.5, conversions: 3, reach: 700, video_views: 90, leads: 1, conversion_value: 30.0 },
  ] as Insight[],
};

// ---------------------------------------------------------------------------
// Large fixture — generates N items to test multi-page traversal
// ---------------------------------------------------------------------------

export function makeLargeInsights(count: number): Insight[] {
  return Array.from({ length: count }, (_, i) => ({
    insight_id: `ins_large_${String(i).padStart(6, "0")}`,
    date: "2025-09-01",
    ad_id: "ad_00001",
    campaign_id: "camp_0001",
    impressions: 1000 + i,
    clicks: 50 + i,
    spend: 25.0 + i,
    conversions: 5 + i,
    reach: 800 + i,
    video_views: 100 + i,
    leads: 2 + (i % 5),
    conversion_value: 40.0 + i * 0.5,
  }));
}
