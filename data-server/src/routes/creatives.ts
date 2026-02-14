import { FastifyInstance } from "fastify";
import { paginate, pageSchema } from "../utils.js";

export async function creativesRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: { page?: number };
  }>("/creatives", {
    schema: { querystring: pageSchema },
  }, async (request) => {
    return paginate(fastify.data.creatives, request.query.page);
  });
}
