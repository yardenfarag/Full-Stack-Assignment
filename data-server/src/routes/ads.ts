import { FastifyInstance } from "fastify";
import { paginate, pageSchema } from "../utils.js";

export async function adsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      page?: number;
      campaignIds?: string;
      dateFrom?: string;
      dateTo?: string;
    };
  }>("/ads", {
    schema: {
      querystring: {
        ...pageSchema,
        properties: {
          ...pageSchema.properties,
          campaignIds: { type: "string" },
          dateFrom: { type: "string" },
          dateTo: { type: "string" },
        },
      },
    },
  }, async (request) => {
    const { page, campaignIds, dateFrom, dateTo } = request.query;

    let filtered = fastify.data.ads;

    if (campaignIds) {
      const idSet = new Set(campaignIds.split(",").filter(Boolean));
      filtered = filtered.filter((ad) => idSet.has(ad.campaign_id));
    }

    if (dateFrom) {
      filtered = filtered.filter((ad) => ad.date_end >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((ad) => ad.date_start <= dateTo);
    }

    return paginate(filtered, page);
  });
}
