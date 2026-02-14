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

describe("GET /api/campaigns", () => {
  it("returns campaigns with the correct response shape", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns" });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("page");
    expect(body.pagination).toHaveProperty("pageSize");
    expect(body.pagination).toHaveProperty("totalPages");
  });

  it("returns all 3 fixture campaigns in a single page", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns" });
    const body = res.json();

    expect(body.data).toHaveLength(3);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(100);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("returns correct campaign fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns" });
    const campaign = res.json().data[0];

    expect(campaign).toHaveProperty("campaign_id");
    expect(campaign).toHaveProperty("campaign_name");
    expect(campaign).toHaveProperty("status");
    expect(campaign).toHaveProperty("campaign_objective");
  });

  it("returns page 1 data by default", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns" });
    const body = res.json();

    expect(body.pagination.page).toBe(1);
    expect(body.data[0].campaign_id).toBe("camp_0001");
  });

  it("accepts explicit page parameter", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns?page=1" });
    const body = res.json();

    expect(body.pagination.page).toBe(1);
    expect(body.data).toHaveLength(3);
  });

  it("returns empty data for page beyond total", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns?page=99" });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.page).toBe(99);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("does not expose cursor-based pagination properties", async () => {
    const res = await app.inject({ method: "GET", url: "/api/campaigns" });
    const { pagination } = res.json();

    expect(pagination).not.toHaveProperty("nextCursor");
    expect(pagination).not.toHaveProperty("count");
  });
});
