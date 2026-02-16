import { FastifyInstance } from "fastify";
import { PerformanceService } from "../services/performance.js";
import { config } from "../config.js";
import { cache, Cache } from "../utils/cache.js";

export async function performanceRoutes(fastify: FastifyInstance) {
  const performanceService = new PerformanceService(fastify.prisma);

  fastify.post(config.endpoints.performance, async (request, reply) => {
    try {
      const body = request.body as any;
      
      // Generate cache key from request body
      const cacheKey = Cache.generateKey("performance", body);
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return reply.send(cached);
      }

      const result = await performanceService.getPerformance(body);
      
      // Cache for 5 minutes (300000 ms)
      // Rationale: Performance queries are expensive (load all insights, aggregate, calculate KPIs)
      // Data only changes when user triggers sync, so longer cache is acceptable
      // Cache is automatically cleared when sync completes, ensuring freshness after data updates
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
      cache.set(cacheKey, result, CACHE_TTL_MS);
      
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error, "Error fetching performance data");
      return reply.code(500).send({
        error: "Failed to fetch performance data",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });
}

