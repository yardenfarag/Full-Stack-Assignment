import { FastifyInstance } from "fastify";
import { DataSyncService } from "../services/dataSync.js";
import { config } from "../config.js";
import { cache } from "../utils/cache.js";

/**
 * Data Sync API Routes
 * 
 * Provides endpoints for:
 * 1. Triggering a full data sync (POST /api/sync)
 * 2. Getting current sync progress (GET /api/sync/status)
 * 
 * Uses Server-Sent Events (SSE) for real-time progress updates.
 */
export async function syncRoutes(fastify: FastifyInstance) {
  const syncService = new DataSyncService(fastify.prisma);

  // Handle OPTIONS preflight for SSE endpoint
  fastify.options(config.endpoints.syncStatus, async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Cache-Control");
    return reply.code(204).send();
  });

  // POST /api/sync - Trigger data sync
  fastify.post(config.endpoints.sync, async (request, reply) => {
    const currentStatus = syncService.getProgress().status;

    if (currentStatus === "syncing") {
      return reply.code(409).send({
        error: "Sync already in progress",
      });
    }

    // Start sync in background
    syncService.syncAll()
      .then(() => {
        // Clear performance query cache when sync completes successfully
        // This ensures fresh data after sync
        cache.clear();
        fastify.log.info("Data sync completed, cache cleared");
      })
      .catch((error) => {
        fastify.log.error(error, "Sync failed");
      });

    return reply.send({ message: "Sync started" });
  });

  // GET /api/sync/status - Get current sync status (SSE)
  fastify.get(config.endpoints.syncStatus, async (request, reply) => {
    // Set CORS headers for SSE
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.setHeader("Access-Control-Allow-Methods", "GET");
    reply.raw.setHeader("Access-Control-Allow-Headers", "Cache-Control");
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    // Send initial status
    const initialProgress = syncService.getProgress();
    reply.raw.write(`data: ${JSON.stringify(initialProgress)}\n\n`);

    // Subscribe to progress updates
    const unsubscribe = syncService.subscribe((progress) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(progress)}\n\n`);
      } catch (error) {
        fastify.log.error(error, "Error sending SSE update");
        unsubscribe();
      }
    });

    // Clean up on client disconnect
    request.raw.on("close", () => {
      unsubscribe();
      reply.raw.end();
    });
  });
}

