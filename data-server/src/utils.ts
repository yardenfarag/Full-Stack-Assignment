// ---------------------------------------------------------------------------
// Numeric page-based pagination
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 100;

export function paginate<T>(items: T[], page: number = 1): PaginatedResponse<T> {
  const safePage = Math.max(1, Math.floor(page));
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const data = items.slice(start, end);

  return {
    data,
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages,
    },
  };
}

// ---------------------------------------------------------------------------
// Random error generator — probabilistic, not based on actual request volume
// ---------------------------------------------------------------------------

export interface RandomErrorResult {
  shouldError: boolean;
  statusCode?: number;
  body?: Record<string, unknown>;
}

export function checkRandomError(): RandomErrorResult {
  const roll = Math.random();

  if (roll < 0.10) {
    return {
      shouldError: true,
      statusCode: 500,
      body: {
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please retry your request.",
      },
    };
  }

  if (roll < 0.15) {
    return {
      shouldError: true,
      statusCode: 429,
      body: {
        error: "Rate Limit Exceeded",
        message: "Too many requests. Please wait before retrying.",
        retryAfterMs: 1000,
      },
    };
  }

  return { shouldError: false };
}

// ---------------------------------------------------------------------------
// Response delay — 5 seconds per successful response
// ---------------------------------------------------------------------------

export const RESPONSE_DELAY_MS = 5000;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

export const pageSchema = {
  type: "object" as const,
  properties: {
    page: { type: "number" as const },
  },
};
