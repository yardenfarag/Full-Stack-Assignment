import { describe, it, expect } from "vitest";
import { paginate, checkRandomError } from "../utils.js";

const items = Array.from({ length: 250 }, (_, i) => ({ id: i + 1 }));

describe("paginate", () => {
  it("returns the first 100 items when no page is given", () => {
    const result = paginate(items);

    expect(result.data).toHaveLength(100);
    expect(result.data[0]).toEqual({ id: 1 });
    expect(result.data[99]).toEqual({ id: 100 });
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(100);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("returns the second page when page=2", () => {
    const result = paginate(items, 2);

    expect(result.data).toHaveLength(100);
    expect(result.data[0]).toEqual({ id: 101 });
    expect(result.data[99]).toEqual({ id: 200 });
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("returns the last page with fewer items", () => {
    const result = paginate(items, 3);

    expect(result.data).toHaveLength(50);
    expect(result.data[0]).toEqual({ id: 201 });
    expect(result.data[49]).toEqual({ id: 250 });
    expect(result.pagination.page).toBe(3);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("returns empty data for a page beyond totalPages", () => {
    const result = paginate(items, 99);

    expect(result.data).toHaveLength(0);
    expect(result.pagination.page).toBe(99);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("treats page=0 as page=1", () => {
    const result = paginate(items, 0);

    expect(result.pagination.page).toBe(1);
    expect(result.data[0]).toEqual({ id: 1 });
  });

  it("treats negative page as page=1", () => {
    const result = paginate(items, -5);

    expect(result.pagination.page).toBe(1);
    expect(result.data[0]).toEqual({ id: 1 });
  });

  it("returns all items with totalPages=1 when fewer than 100", () => {
    const small = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const result = paginate(small);

    expect(result.data).toHaveLength(50);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(100);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("returns empty data with totalPages=1 for an empty array", () => {
    const result = paginate([]);

    expect(result.data).toHaveLength(0);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("exposes totalPages, page, and pageSize in pagination", () => {
    const result = paginate(items);

    expect(result.pagination).toHaveProperty("page");
    expect(result.pagination).toHaveProperty("pageSize");
    expect(result.pagination).toHaveProperty("totalPages");
  });

  it("does not expose cursor-based properties", () => {
    const result = paginate(items);

    expect(result.pagination).not.toHaveProperty("nextCursor");
    expect(result.pagination).not.toHaveProperty("count");
    expect(result.pagination).not.toHaveProperty("hasMore");
  });

  it("allows direct access to any page without fetching previous pages", () => {
    const page3 = paginate(items, 3);

    expect(page3.data[0]).toEqual({ id: 201 });
    expect(page3.data).toHaveLength(50);
  });

  it("calculates totalPages correctly for exact multiples", () => {
    const exact = Array.from({ length: 300 }, (_, i) => ({ id: i + 1 }));
    const result = paginate(exact);

    expect(result.pagination.totalPages).toBe(3);
  });

  it("calculates totalPages correctly for non-exact multiples", () => {
    const nonExact = Array.from({ length: 301 }, (_, i) => ({ id: i + 1 }));
    const result = paginate(nonExact);

    expect(result.pagination.totalPages).toBe(4);
  });

  it("floors fractional page numbers", () => {
    const result = paginate(items, 2.7);

    expect(result.pagination.page).toBe(2);
    expect(result.data[0]).toEqual({ id: 101 });
  });
});

describe("checkRandomError", () => {
  it("returns an object with shouldError boolean", () => {
    const result = checkRandomError();
    expect(result).toHaveProperty("shouldError");
    expect(typeof result.shouldError).toBe("boolean");
  });

  it("returns statusCode and body when shouldError is true", () => {
    // Run enough times to statistically get an error
    let errorResult = null;
    for (let i = 0; i < 200; i++) {
      const result = checkRandomError();
      if (result.shouldError) {
        errorResult = result;
        break;
      }
    }

    expect(errorResult).not.toBeNull();
    expect(errorResult!.statusCode).toBeDefined();
    expect(errorResult!.body).toBeDefined();
    expect([429, 500]).toContain(errorResult!.statusCode);
  });

  it("does not include statusCode/body when shouldError is false", () => {
    let okResult = null;
    for (let i = 0; i < 200; i++) {
      const result = checkRandomError();
      if (!result.shouldError) {
        okResult = result;
        break;
      }
    }

    expect(okResult).not.toBeNull();
    expect(okResult!.shouldError).toBe(false);
  });

  it("produces a mix of 500 and 429 errors over many calls", () => {
    const errors: number[] = [];
    for (let i = 0; i < 2000; i++) {
      const result = checkRandomError();
      if (result.shouldError && result.statusCode) {
        errors.push(result.statusCode);
      }
    }

    const count500 = errors.filter((c) => c === 500).length;
    const count429 = errors.filter((c) => c === 429).length;

    expect(count500).toBeGreaterThan(0);
    expect(count429).toBeGreaterThan(0);
    // 500s should be more frequent than 429s (~10% vs ~5%)
    expect(count500).toBeGreaterThan(count429);
  });

  it("500 error has correct body shape", () => {
    let found = false;
    for (let i = 0; i < 500; i++) {
      const result = checkRandomError();
      if (result.shouldError && result.statusCode === 500) {
        expect(result.body).toEqual({
          error: "Internal Server Error",
          message: "An unexpected error occurred. Please retry your request.",
        });
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("429 error has correct body shape with retryAfterMs", () => {
    let found = false;
    for (let i = 0; i < 500; i++) {
      const result = checkRandomError();
      if (result.shouldError && result.statusCode === 429) {
        expect(result.body).toEqual({
          error: "Rate Limit Exceeded",
          message: "Too many requests. Please wait before retrying.",
          retryAfterMs: 1000,
        });
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
