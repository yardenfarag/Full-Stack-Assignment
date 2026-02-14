import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { FastifyInstance } from "fastify";
import { buildAppWithRandomErrors, fixtures } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildAppWithRandomErrors(fixtures);
});

afterAll(async () => {
  await app.close();
});

describe("random errors", () => {
  it("most requests succeed with 200", async () => {
    const results: number[] = [];
    for (let i = 0; i < 100; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      results.push(res.statusCode);
    }

    const ok = results.filter((c) => c === 200).length;
    // With ~15% error rate, we expect at least 50 out of 100 to succeed
    expect(ok).toBeGreaterThan(50);
  });

  it("some requests return 500 Internal Server Error", async () => {
    const errors: any[] = [];
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      if (res.statusCode === 500) {
        errors.push(res.json());
      }
    }

    expect(errors.length).toBeGreaterThan(0);

    const sample = errors[0];
    expect(sample).toEqual({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please retry your request.",
    });
  });

  it("some requests return 429 Rate Limit Exceeded", async () => {
    const errors: any[] = [];
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      if (res.statusCode === 429) {
        errors.push(res.json());
      }
    }

    expect(errors.length).toBeGreaterThan(0);

    const sample = errors[0];
    expect(sample).toEqual({
      error: "Rate Limit Exceeded",
      message: "Too many requests. Please wait before retrying.",
      retryAfterMs: 1000,
    });
  });

  it("errors have the correct status codes (only 200, 429, or 500)", async () => {
    const codes = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      codes.add(res.statusCode);
    }

    for (const code of codes) {
      expect([200, 429, 500]).toContain(code);
    }
  });

  it("500 errors do not include data payload", async () => {
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      if (res.statusCode === 500) {
        const body = res.json();
        expect(body).not.toHaveProperty("data");
        expect(body).not.toHaveProperty("pagination");
        break;
      }
    }
  });

  it("429 errors do not include data payload", async () => {
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      if (res.statusCode === 429) {
        const body = res.json();
        expect(body).not.toHaveProperty("data");
        expect(body).not.toHaveProperty("pagination");
        break;
      }
    }
  });

  it("successful responses still have correct data shape", async () => {
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      if (res.statusCode === 200) {
        const body = res.json();
        expect(body).toHaveProperty("data");
        expect(body).toHaveProperty("pagination");
        expect(body.pagination).toHaveProperty("page");
        expect(body.pagination).toHaveProperty("pageSize");
        expect(body.pagination).toHaveProperty("totalPages");
        break;
      }
    }
  });

  it("errors affect all endpoints equally", async () => {
    const endpoints = ["/api/campaigns", "/api/ads", "/api/creatives", "/api/insights"];
    for (const endpoint of endpoints) {
      const codes = new Set<number>();
      for (let i = 0; i < 100; i++) {
        const res = await app.inject({ method: "GET", url: endpoint });
        codes.add(res.statusCode);
      }
      // Each endpoint should see at least some errors
      expect(codes.size).toBeGreaterThan(1);
    }
  });

  it("429 error body includes retryAfterMs as a number", async () => {
    for (let i = 0; i < 200; i++) {
      const res = await app.inject({ method: "GET", url: "/api/campaigns" });
      if (res.statusCode === 429) {
        const body = res.json();
        expect(typeof body.retryAfterMs).toBe("number");
        expect(body.retryAfterMs).toBeGreaterThan(0);
        break;
      }
    }
  });
});
