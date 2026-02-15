import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp, fixtures } from "./helpers.js";
import type { Campaign, Ad, Creative, Insight } from "../index.js";

// ---------------------------------------------------------------------------
// Helper to clone fixtures so each test suite starts fresh
// ---------------------------------------------------------------------------
function cloneFixtures() {
  return {
    campaigns: structuredClone(fixtures.campaigns),
    ads: structuredClone(fixtures.ads),
    creatives: structuredClone(fixtures.creatives),
    insights: structuredClone(fixtures.insights),
  };
}

// ---------------------------------------------------------------------------
// Cross-endpoint relationship tests
// ---------------------------------------------------------------------------
describe("cross-endpoint relationships", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(cloneFixtures());
  });
  afterAll(async () => {
    await app.close();
  });

  it("every ad references an existing campaign", async () => {
    const campRes = await app.inject({ method: "GET", url: "/api/campaigns" });
    const adsRes = await app.inject({ method: "GET", url: "/api/ads" });
    const campaignIds = new Set(
      (campRes.json().data as Campaign[]).map((c) => c.campaign_id)
    );
    for (const ad of adsRes.json().data as Ad[]) {
      expect(campaignIds.has(ad.campaign_id)).toBe(true);
    }
  });

  it("every ad references an existing creative", async () => {
    const crRes = await app.inject({ method: "GET", url: "/api/creatives" });
    const adsRes = await app.inject({ method: "GET", url: "/api/ads" });
    const creativeIds = new Set(
      (crRes.json().data as Creative[]).map((c) => c.creative_id)
    );
    for (const ad of adsRes.json().data as Ad[]) {
      expect(creativeIds.has(ad.creative_id)).toBe(true);
    }
  });

  it("every insight references an existing campaign", async () => {
    const campRes = await app.inject({ method: "GET", url: "/api/campaigns" });
    const insRes = await app.inject({ method: "GET", url: "/api/insights" });
    const campaignIds = new Set(
      (campRes.json().data as Campaign[]).map((c) => c.campaign_id)
    );
    for (const ins of insRes.json().data as Insight[]) {
      expect(campaignIds.has(ins.campaign_id)).toBe(true);
    }
  });

  it("every insight references an existing ad", async () => {
    const adsRes = await app.inject({ method: "GET", url: "/api/ads" });
    const insRes = await app.inject({ method: "GET", url: "/api/insights" });
    const adIds = new Set(
      (adsRes.json().data as Ad[]).map((a) => a.ad_id)
    );
    for (const ins of insRes.json().data as Insight[]) {
      expect(adIds.has(ins.ad_id)).toBe(true);
    }
  });

  it("filtering ads by campaignId returns only ads for that campaign", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001",
    });
    const ads = res.json().data as Ad[];
    expect(ads.length).toBeGreaterThan(0);
    for (const ad of ads) {
      expect(ad.campaign_id).toBe("camp_0001");
    }
  });

  it("filtering insights by campaignId returns only insights for that campaign", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001",
    });
    const insights = res.json().data as Insight[];
    expect(insights.length).toBeGreaterThan(0);
    for (const ins of insights) {
      expect(ins.campaign_id).toBe("camp_0001");
    }
  });

  it("filtering insights by adId returns matching insights", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?adIds=ad_00004",
    });
    const insights = res.json().data as Insight[];
    expect(insights.length).toBeGreaterThan(0);
    for (const ins of insights) {
      expect(ins.ad_id).toBe("ad_00004");
    }
  });

  it("campaign → ads → insights chain is consistent", async () => {
    // Pick camp_0003, get its ads, then get insights for those ads
    const adsRes = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0003",
    });
    const ads = adsRes.json().data as Ad[];
    const adIds = ads.map((a) => a.ad_id);
    expect(adIds.length).toBeGreaterThan(0);

    const insRes = await app.inject({
      method: "GET",
      url: `/api/insights?campaignIds=camp_0003`,
    });
    const insights = insRes.json().data as Insight[];
    // Every insight for camp_0003 must reference one of camp_0003's ads
    for (const ins of insights) {
      expect(adIds).toContain(ins.ad_id);
    }
  });
});

// ---------------------------------------------------------------------------
// Adding data to the in-memory store
// ---------------------------------------------------------------------------
describe("adding items to the data store", () => {
  let app: FastifyInstance;
  let data: ReturnType<typeof cloneFixtures>;

  beforeAll(async () => {
    data = cloneFixtures();
    app = await buildApp(data);
  });
  afterAll(async () => {
    await app.close();
  });

  it("newly added campaign is returned by GET /api/campaigns", async () => {
    const newCampaign: Campaign = {
      campaign_id: "camp_new_001",
      campaign_name: "New Launch",
      status: "active",
      campaign_objective: "LEADS",
    };
    data.campaigns.push(newCampaign);

    const res = await app.inject({ method: "GET", url: "/api/campaigns" });
    const campaigns = res.json().data as Campaign[];
    const found = campaigns.find((c) => c.campaign_id === "camp_new_001");
    expect(found).toBeDefined();
    expect(found!.campaign_name).toBe("New Launch");
    expect(found!.campaign_objective).toBe("LEADS");
  });

  it("newly added ad is returned by GET /api/ads", async () => {
    const newAd: Ad = {
      ad_id: "ad_new_001",
      campaign_id: "camp_0001",
      creative_id: "cr_0001",
      date_start: "2026-03-01",
      date_end: "2026-04-01",
      name: "New Ad",
      description: "Brand new ad",
      status: "active",
    };
    data.ads.push(newAd);

    const res = await app.inject({ method: "GET", url: "/api/ads" });
    const ads = res.json().data as Ad[];
    const found = ads.find((a) => a.ad_id === "ad_new_001");
    expect(found).toBeDefined();
    expect(found!.name).toBe("New Ad");
    expect(found!.campaign_id).toBe("camp_0001");
  });

  it("newly added creative is returned by GET /api/creatives", async () => {
    const newCreative: Creative = {
      creative_id: "cr_new_001",
      creative_type: "video",
      thumbnail_url: "https://example.com/new.png",
    };
    data.creatives.push(newCreative);

    const res = await app.inject({ method: "GET", url: "/api/creatives" });
    const creatives = res.json().data as Creative[];
    const found = creatives.find((c) => c.creative_id === "cr_new_001");
    expect(found).toBeDefined();
    expect(found!.creative_type).toBe("video");
  });

  it("newly added insight is returned by GET /api/insights", async () => {
    const newInsight: Insight = {
      insight_id: "ins_new_001",
      date: "2026-03-15",
      ad_id: "ad_00001",
      campaign_id: "camp_0001",
      impressions: 5000,
      clicks: 250,
      spend: 125.0,
      conversions: 25,
      reach: 4000,
      video_views: 500,
      leads: 10,
      conversion_value: 300.0,
    };
    data.insights.push(newInsight);

    const res = await app.inject({ method: "GET", url: "/api/insights" });
    const insights = res.json().data as Insight[];
    const found = insights.find((i) => i.insight_id === "ins_new_001");
    expect(found).toBeDefined();
    expect(found!.impressions).toBe(5000);
    expect(found!.spend).toBe(125.0);
  });

  it("added ad is filterable by campaignId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001",
    });
    const ads = res.json().data as Ad[];
    const found = ads.find((a) => a.ad_id === "ad_new_001");
    expect(found).toBeDefined();
  });

  it("added ad is filterable by date range", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?dateFrom=2026-03-01&dateTo=2026-04-01",
    });
    const ads = res.json().data as Ad[];
    const found = ads.find((a) => a.ad_id === "ad_new_001");
    expect(found).toBeDefined();
  });

  it("added insight is filterable by campaignId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001",
    });
    const insights = res.json().data as Insight[];
    const found = insights.find((i) => i.insight_id === "ins_new_001");
    expect(found).toBeDefined();
  });

  it("added insight is filterable by adId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?adIds=ad_00001",
    });
    const insights = res.json().data as Insight[];
    const found = insights.find((i) => i.insight_id === "ins_new_001");
    expect(found).toBeDefined();
  });

  it("added insight is filterable by date range", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?dateFrom=2026-03-01&dateTo=2026-03-31",
    });
    const insights = res.json().data as Insight[];
    const found = insights.find((i) => i.insight_id === "ins_new_001");
    expect(found).toBeDefined();
  });

  it("pagination totalPages updates when items are added", async () => {
    const before = await app.inject({ method: "GET", url: "/api/campaigns" });
    const totalBefore = before.json().pagination.totalPages;

    // Add enough campaigns to push past a page boundary
    for (let i = 0; i < 100; i++) {
      data.campaigns.push({
        campaign_id: `camp_bulk_${String(i).padStart(4, "0")}`,
        campaign_name: `Bulk Campaign ${i}`,
        status: "active",
        campaign_objective: "TRAFFIC",
      });
    }

    const after = await app.inject({ method: "GET", url: "/api/campaigns" });
    expect(after.json().pagination.totalPages).toBeGreaterThan(totalBefore);
  });

  it("newly added campaigns appear on page 2 after bulk insert", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/campaigns?page=2",
    });
    const campaigns = res.json().data as Campaign[];
    expect(campaigns.length).toBeGreaterThan(0);
    const bulkIds = campaigns
      .filter((c) => c.campaign_id.startsWith("camp_bulk_"))
      .map((c) => c.campaign_id);
    expect(bulkIds.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Full user flow: browse campaigns → drill into ads → view insights
// ---------------------------------------------------------------------------
describe("end-to-end user flow", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(cloneFixtures());
  });
  afterAll(async () => {
    await app.close();
  });

  it("browse campaigns, pick one, get its ads, get insights for those ads", async () => {
    // Step 1: list campaigns
    const campRes = await app.inject({ method: "GET", url: "/api/campaigns" });
    expect(campRes.statusCode).toBe(200);
    const campaigns = campRes.json().data as Campaign[];
    expect(campaigns.length).toBeGreaterThan(0);

    // Step 2: pick the first active campaign
    const activeCampaign = campaigns.find((c) => c.status === "active");
    expect(activeCampaign).toBeDefined();

    // Step 3: get ads for this campaign
    const adsRes = await app.inject({
      method: "GET",
      url: `/api/ads?campaignIds=${activeCampaign!.campaign_id}`,
    });
    expect(adsRes.statusCode).toBe(200);
    const ads = adsRes.json().data as Ad[];
    expect(ads.length).toBeGreaterThan(0);
    for (const ad of ads) {
      expect(ad.campaign_id).toBe(activeCampaign!.campaign_id);
    }

    // Step 4: get insights for those ads
    const adIds = ads.map((a) => a.ad_id).join(",");
    const insRes = await app.inject({
      method: "GET",
      url: `/api/insights?adIds=${adIds}`,
    });
    expect(insRes.statusCode).toBe(200);
    const insights = insRes.json().data as Insight[];
    expect(insights.length).toBeGreaterThan(0);
    const adIdSet = new Set(ads.map((a) => a.ad_id));
    for (const ins of insights) {
      expect(adIdSet.has(ins.ad_id)).toBe(true);
    }
  });

  it("date-scoped drill-down: ads and insights in the same date range", async () => {
    const dateFrom = "2025-12-01";
    const dateTo = "2026-01-31";

    const adsRes = await app.inject({
      method: "GET",
      url: `/api/ads?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    });
    const ads = adsRes.json().data as Ad[];
    expect(ads.length).toBeGreaterThan(0);
    for (const ad of ads) {
      // ad.date_end >= dateFrom AND ad.date_start <= dateTo
      expect(ad.date_end >= dateFrom).toBe(true);
      expect(ad.date_start <= dateTo).toBe(true);
    }

    const insRes = await app.inject({
      method: "GET",
      url: `/api/insights?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    });
    const insights = insRes.json().data as Insight[];
    expect(insights.length).toBeGreaterThan(0);
    for (const ins of insights) {
      expect(ins.date >= dateFrom).toBe(true);
      expect(ins.date <= dateTo).toBe(true);
    }
  });

  it("combining campaignId + date filters narrows results consistently", async () => {
    const campaignId = "camp_0003";
    const dateFrom = "2025-12-01";

    const adsRes = await app.inject({
      method: "GET",
      url: `/api/ads?campaignIds=${campaignId}&dateFrom=${dateFrom}`,
    });
    const ads = adsRes.json().data as Ad[];
    for (const ad of ads) {
      expect(ad.campaign_id).toBe(campaignId);
      expect(ad.date_end >= dateFrom).toBe(true);
    }

    const insRes = await app.inject({
      method: "GET",
      url: `/api/insights?campaignIds=${campaignId}&dateFrom=${dateFrom}`,
    });
    const insights = insRes.json().data as Insight[];
    for (const ins of insights) {
      expect(ins.campaign_id).toBe(campaignId);
      expect(ins.date >= dateFrom).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Response shape consistency across all endpoints
// ---------------------------------------------------------------------------
describe("response shape consistency", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(cloneFixtures());
  });
  afterAll(async () => {
    await app.close();
  });

  const endpoints = [
    "/api/campaigns",
    "/api/ads",
    "/api/creatives",
    "/api/insights",
  ];

  for (const url of endpoints) {
    it(`${url} returns 200 with data array and pagination object`, async () => {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
      expect(body.pagination).toHaveProperty("page");
      expect(body.pagination).toHaveProperty("pageSize");
      expect(body.pagination).toHaveProperty("totalPages");
      expect(body.pagination.pageSize).toBe(100);
    });

    it(`${url} does not expose cursor-based pagination fields`, async () => {
      const res = await app.inject({ method: "GET", url });
      const body = res.json();
      expect(body.pagination).not.toHaveProperty("nextCursor");
      expect(body.pagination).not.toHaveProperty("hasMore");
      expect(body.pagination).not.toHaveProperty("count");
    });

    it(`${url}?page=999 returns empty data with totalPages >= 1`, async () => {
      const res = await app.inject({ method: "GET", url: `${url}?page=999` });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(0);
      expect(body.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });
  }
});

// ---------------------------------------------------------------------------
// Edge cases for filters
// ---------------------------------------------------------------------------
describe("filter edge cases", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(cloneFixtures());
  });
  afterAll(async () => {
    await app.close();
  });

  it("empty campaignIds string returns all ads (no filter applied)", async () => {
    const allRes = await app.inject({ method: "GET", url: "/api/ads" });
    const filteredRes = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=",
    });
    expect(filteredRes.json().data.length).toBe(allRes.json().data.length);
  });

  it("non-existent campaignId returns empty", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_nonexistent",
    });
    expect(res.json().data).toHaveLength(0);
  });

  it("non-existent adId in insights returns empty", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?adIds=ad_nonexistent",
    });
    expect(res.json().data).toHaveLength(0);
  });

  it("dateFrom after all data returns empty ads", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?dateFrom=2099-01-01",
    });
    expect(res.json().data).toHaveLength(0);
  });

  it("dateTo before all data returns empty ads", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?dateTo=2000-01-01",
    });
    expect(res.json().data).toHaveLength(0);
  });

  it("dateFrom after all data returns empty insights", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?dateFrom=2099-01-01",
    });
    expect(res.json().data).toHaveLength(0);
  });

  it("dateTo before all data returns empty insights", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?dateTo=2000-01-01",
    });
    expect(res.json().data).toHaveLength(0);
  });

  it("multiple campaignIds with trailing comma work correctly", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001,camp_0003,",
    });
    const ads = res.json().data as Ad[];
    for (const ad of ads) {
      expect(["camp_0001", "camp_0003"]).toContain(ad.campaign_id);
    }
  });

  it("multiple adIds with trailing comma work correctly", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?adIds=ad_00001,ad_00004,",
    });
    const insights = res.json().data as Insight[];
    for (const ins of insights) {
      expect(["ad_00001", "ad_00004"]).toContain(ins.ad_id);
    }
  });
});

// ---------------------------------------------------------------------------
// Data isolation: separate app instances don't share state
// ---------------------------------------------------------------------------
describe("data isolation between instances", () => {
  it("adding to one app instance does not affect another", async () => {
    const data1 = cloneFixtures();
    const data2 = cloneFixtures();
    const app1 = await buildApp(data1);
    const app2 = await buildApp(data2);

    // Add a campaign to app1 only
    data1.campaigns.push({
      campaign_id: "camp_isolated",
      campaign_name: "Isolated",
      status: "active",
      campaign_objective: "TRAFFIC",
    });

    const res1 = await app1.inject({ method: "GET", url: "/api/campaigns" });
    const res2 = await app2.inject({ method: "GET", url: "/api/campaigns" });

    const ids1 = (res1.json().data as Campaign[]).map((c) => c.campaign_id);
    const ids2 = (res2.json().data as Campaign[]).map((c) => c.campaign_id);

    expect(ids1).toContain("camp_isolated");
    expect(ids2).not.toContain("camp_isolated");

    await app1.close();
    await app2.close();
  });
});
