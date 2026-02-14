import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp, fixtures, makeLargeInsights } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp(fixtures);
});

afterAll(async () => {
  await app.close();
});

describe("GET /api/insights", () => {
  it("returns the correct response shape", async () => {
    const res = await app.inject({ method: "GET", url: "/api/insights" });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("page");
    expect(body.pagination).toHaveProperty("pageSize");
    expect(body.pagination).toHaveProperty("totalPages");
  });

  it("returns all 7 fixture insights in a single page", async () => {
    const res = await app.inject({ method: "GET", url: "/api/insights" });
    const body = res.json();

    expect(body.data).toHaveLength(7);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("returns correct insight fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/insights" });
    const insight = res.json().data[0];

    expect(insight).toHaveProperty("insight_id");
    expect(insight).toHaveProperty("date");
    expect(insight).toHaveProperty("ad_id");
    expect(insight).toHaveProperty("campaign_id");
    expect(insight).toHaveProperty("impressions");
    expect(insight).toHaveProperty("clicks");
    expect(insight).toHaveProperty("spend");
    expect(insight).toHaveProperty("conversions");
    expect(insight).toHaveProperty("reach");
    expect(insight).toHaveProperty("video_views");
    expect(insight).toHaveProperty("leads");
    expect(insight).toHaveProperty("conversion_value");
  });

  it("returns empty data for page beyond total", async () => {
    const res = await app.inject({ method: "GET", url: "/api/insights?page=99" });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  // ---- campaignIds filter ----

  it("filters by a single campaignId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001",
    });
    const body = res.json();

    expect(body.data).toHaveLength(3);
    expect(body.data.every((i: any) => i.campaign_id === "camp_0001")).toBe(true);
  });

  it("filters by multiple campaignIds", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001,camp_0002",
    });
    const body = res.json();

    // camp_0001: 3, camp_0002: 1
    expect(body.data).toHaveLength(4);
  });

  // ---- adIds filter ----

  it("filters by a single adId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?adIds=ad_00001",
    });
    const body = res.json();

    expect(body.data).toHaveLength(2);
    expect(body.data.every((i: any) => i.ad_id === "ad_00001")).toBe(true);
  });

  it("filters by multiple adIds", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?adIds=ad_00001,ad_00004",
    });
    const body = res.json();

    // ad_00001: 2, ad_00004: 2
    expect(body.data).toHaveLength(4);
  });

  // ---- dateFrom filter ----

  it("filters by dateFrom", async () => {
    // dateFrom=2025-10-01 -> ins_4 (Oct1), ins_5 (Dec15), ins_6 (Jan10)
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?dateFrom=2025-10-01",
    });
    const body = res.json();

    expect(body.data).toHaveLength(3);
    expect(body.data.every((i: any) => i.date >= "2025-10-01")).toBe(true);
  });

  // ---- dateTo filter ----

  it("filters by dateTo", async () => {
    // dateTo=2025-08-31 -> ins_1 (Aug1), ins_2 (Aug2), ins_7 (Aug20)
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?dateTo=2025-08-31",
    });
    const body = res.json();

    expect(body.data).toHaveLength(3);
    expect(body.data.every((i: any) => i.date <= "2025-08-31")).toBe(true);
  });

  // ---- combined filters ----

  it("combines campaignIds + adIds", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001&adIds=ad_00001",
    });
    const body = res.json();

    expect(body.data).toHaveLength(2);
  });

  it("combines campaignIds + date range", async () => {
    // camp_0003: ins_5 (Dec15), ins_6 (Jan10), ins_7 (Aug20)
    // dateFrom=2025-12-01 -> ins_5 and ins_6
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0003&dateFrom=2025-12-01",
    });
    const body = res.json();

    expect(body.data).toHaveLength(2);
    const ids = body.data.map((i: any) => i.insight_id);
    expect(ids).toContain("ins_000005");
    expect(ids).toContain("ins_000006");
  });

  it("combines all filters", async () => {
    // camp_0003, ad_00004, 2026-01-01..2026-01-31 -> only ins_6
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0003&adIds=ad_00004&dateFrom=2026-01-01&dateTo=2026-01-31",
    });
    const body = res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].insight_id).toBe("ins_000006");
  });

  it("returns empty when no insights match", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_9999",
    });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("does not expose cursor-based pagination properties", async () => {
    const res = await app.inject({ method: "GET", url: "/api/insights" });
    const { pagination } = res.json();

    expect(pagination).not.toHaveProperty("nextCursor");
    expect(pagination).not.toHaveProperty("count");
  });

  it("totalPages reflects filtered count", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001",
    });
    const body = res.json();

    expect(body.pagination.totalPages).toBe(1);
    expect(body.data).toHaveLength(3);
  });
});

describe("GET /api/insights — numeric pagination with large dataset", () => {
  let largeApp: FastifyInstance;

  beforeAll(async () => {
    largeApp = await buildApp({
      ...fixtures,
      insights: makeLargeInsights(250),
    });
  });

  afterAll(async () => {
    await largeApp.close();
  });

  it("returns 100 items on page 1 with totalPages=3", async () => {
    const res = await largeApp.inject({ method: "GET", url: "/api/insights?page=1" });
    const body = res.json();

    expect(body.data).toHaveLength(100);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.totalPages).toBe(3);
  });

  it("returns 100 items on page 2", async () => {
    const res = await largeApp.inject({ method: "GET", url: "/api/insights?page=2" });
    const body = res.json();

    expect(body.data).toHaveLength(100);
    expect(body.pagination.page).toBe(2);
  });

  it("returns 50 items on page 3 (last page)", async () => {
    const res = await largeApp.inject({ method: "GET", url: "/api/insights?page=3" });
    const body = res.json();

    expect(body.data).toHaveLength(50);
    expect(body.pagination.page).toBe(3);
  });

  it("returns empty data on page 4 (beyond total)", async () => {
    const res = await largeApp.inject({ method: "GET", url: "/api/insights?page=4" });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(3);
  });

  it("collects all 250 items across 3 pages", async () => {
    const collected: any[] = [];

    for (let page = 1; page <= 3; page++) {
      const res = await largeApp.inject({ method: "GET", url: `/api/insights?page=${page}` });
      const body = res.json();
      collected.push(...body.data);
    }

    expect(collected).toHaveLength(250);
  });

  it("pages contain non-overlapping data", async () => {
    const ids = new Set<string>();

    for (let page = 1; page <= 3; page++) {
      const res = await largeApp.inject({ method: "GET", url: `/api/insights?page=${page}` });
      const body = res.json();
      for (const item of body.data) {
        expect(ids.has(item.insight_id)).toBe(false);
        ids.add(item.insight_id);
      }
    }

    expect(ids.size).toBe(250);
  });

  it("filters are applied before pagination", async () => {
    // All 250 large insights have campaign_id=camp_0001
    // Filtering by camp_9999 should return 0 regardless of page
    const res = await largeApp.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_9999",
    });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("totalPages reflects filtered dataset size", async () => {
    // All 250 large insights have campaign_id=camp_0001
    const res = await largeApp.inject({
      method: "GET",
      url: "/api/insights?campaignIds=camp_0001",
    });
    const body = res.json();

    expect(body.pagination.totalPages).toBe(3);
    expect(body.data).toHaveLength(100);
  });
});
