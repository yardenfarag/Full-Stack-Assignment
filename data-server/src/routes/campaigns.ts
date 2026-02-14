import { FastifyInstance } from "fastify";
import { paginate, pageSchema } from "../utils.js";

export async function campaignsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: { page?: number };
  }>("/campaigns", {
    schema: { querystring: pageSchema },
  }, async (request) => {
    return paginate(fastify.data.campaigns, request.query.page);
  });
}
