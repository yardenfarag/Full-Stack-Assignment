import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp, fixtures } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp(fixtures);
});

afterAll(async () => {
  await app.close();
});

describe("GET /api/ads", () => {
  it("returns the correct response shape", async () => {
    const res = await app.inject({ method: "GET", url: "/api/ads" });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("page");
    expect(body.pagination).toHaveProperty("pageSize");
    expect(body.pagination).toHaveProperty("totalPages");
  });

  it("returns all 5 fixture ads in a single page", async () => {
    const res = await app.inject({ method: "GET", url: "/api/ads" });
    const body = res.json();

    expect(body.data).toHaveLength(5);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("returns correct ad fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/ads" });
    const ad = res.json().data[0];

    expect(ad).toHaveProperty("ad_id");
    expect(ad).toHaveProperty("campaign_id");
    expect(ad).toHaveProperty("creative_id");
    expect(ad).toHaveProperty("date_start");
    expect(ad).toHaveProperty("date_end");
    expect(ad).toHaveProperty("name");
    expect(ad).toHaveProperty("description");
    expect(ad).toHaveProperty("status");
  });

  it("returns empty data for page beyond total", async () => {
    const res = await app.inject({ method: "GET", url: "/api/ads?page=99" });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  // ---- campaignIds filter ----

  it("filters by a single campaignId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001",
    });
    const body = res.json();

    expect(body.data).toHaveLength(2);
    expect(body.data.every((ad: any) => ad.campaign_id === "camp_0001")).toBe(true);
  });

  it("filters by multiple campaignIds", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001,camp_0003",
    });
    const body = res.json();

    expect(body.data).toHaveLength(4);
    const ids = new Set(body.data.map((ad: any) => ad.campaign_id));
    expect(ids).toEqual(new Set(["camp_0001", "camp_0003"]));
  });

  it("returns empty when filtering by non-existent campaignId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_9999",
    });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  // ---- dateFrom filter ----

  it("filters by dateFrom (ads whose date_end >= dateFrom)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?dateFrom=2025-11-01",
    });
    const body = res.json();

    expect(body.data).toHaveLength(2);
    const ids = body.data.map((ad: any) => ad.ad_id);
    expect(ids).toContain("ad_00002");
    expect(ids).toContain("ad_00004");
  });

  // ---- dateTo filter ----

  it("filters by dateTo (ads whose date_start <= dateTo)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?dateTo=2025-09-01",
    });
    const body = res.json();

    expect(body.data).toHaveLength(3);
    const ids = body.data.map((ad: any) => ad.ad_id);
    expect(ids).toContain("ad_00001");
    expect(ids).toContain("ad_00003");
    expect(ids).toContain("ad_00005");
  });

  // ---- combined filters ----

  it("combines campaignIds + date range filters", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001&dateFrom=2025-10-01&dateTo=2025-12-01",
    });
    const body = res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].ad_id).toBe("ad_00002");
  });

  it("does not expose cursor-based pagination properties", async () => {
    const res = await app.inject({ method: "GET", url: "/api/ads" });
    const { pagination } = res.json();

    expect(pagination).not.toHaveProperty("nextCursor");
    expect(pagination).not.toHaveProperty("count");
  });

  it("totalPages reflects filtered count", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/ads?campaignIds=camp_0001",
    });
    const body = res.json();

    expect(body.pagination.totalPages).toBe(1);
    expect(body.data).toHaveLength(2);
  });
});
