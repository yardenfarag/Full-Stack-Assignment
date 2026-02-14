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

describe("GET /api/creatives", () => {
  it("returns the correct response shape", async () => {
    const res = await app.inject({ method: "GET", url: "/api/creatives" });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("page");
    expect(body.pagination).toHaveProperty("pageSize");
    expect(body.pagination).toHaveProperty("totalPages");
  });

  it("returns all 3 fixture creatives in a single page", async () => {
    const res = await app.inject({ method: "GET", url: "/api/creatives" });
    const body = res.json();

    expect(body.data).toHaveLength(3);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("returns correct creative fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/creatives" });
    const creative = res.json().data[0];

    expect(creative).toHaveProperty("creative_id");
    expect(creative).toHaveProperty("creative_type");
    expect(creative).toHaveProperty("thumbnail_url");
    expect(["image", "video"]).toContain(creative.creative_type);
  });

  it("returns empty data for page beyond total", async () => {
    const res = await app.inject({ method: "GET", url: "/api/creatives?page=99" });
    const body = res.json();

    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("does not expose cursor-based pagination properties", async () => {
    const res = await app.inject({ method: "GET", url: "/api/creatives" });
    const { pagination } = res.json();

    expect(pagination).not.toHaveProperty("nextCursor");
    expect(pagination).not.toHaveProperty("count");
  });
});
