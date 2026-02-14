import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

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

  // ---------------------------------------------------------------------------
  // TODO: Your implementation goes here!
  //
  // See home-assignment.md for the full requirements.
  // See data-server/API.md for the external data server documentation.
  // See server/DATABASE.md and server/prisma/schema.prisma for the DB schema.
  // ---------------------------------------------------------------------------

  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
