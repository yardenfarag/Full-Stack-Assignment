import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { config } from "./config.js";
import { syncRoutes } from "./routes/sync.js";
import { columnsRoutes } from "./routes/columns.js";
import { performanceRoutes } from "./routes/performance.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function main() {
  const prisma = new PrismaClient();
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });

  // Make Prisma available to all routes
  server.decorate("prisma", prisma);

  // Graceful shutdown
  server.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  // Register routes
  await server.register(syncRoutes);
  await server.register(columnsRoutes);
  await server.register(performanceRoutes);

  try {
    await server.listen({ port: config.ports.server, host: config.server.host });
    console.log(`${config.server.baseUrl}:${config.ports.server}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
