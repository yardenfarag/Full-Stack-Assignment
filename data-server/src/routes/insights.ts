import { FastifyInstance } from "fastify";
import { paginate, pageSchema } from "../utils.js";

export async function insightsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      page?: number;
      campaignIds?: string;
      adIds?: string;
      dateFrom?: string;
      dateTo?: string;
    };
  }>("/insights", {
    schema: {
      querystring: {
        ...pageSchema,
        properties: {
          ...pageSchema.properties,
          campaignIds: { type: "string" },
          adIds: { type: "string" },
          dateFrom: { type: "string" },
          dateTo: { type: "string" },
        },
      },
    },
  }, async (request) => {
    const { page, campaignIds, adIds, dateFrom, dateTo } = request.query;

    let filtered = fastify.data.insights;

    if (campaignIds) {
      const idSet = new Set(campaignIds.split(",").filter(Boolean));
      filtered = filtered.filter((i) => idSet.has(i.campaign_id));
    }

    if (adIds) {
      const idSet = new Set(adIds.split(",").filter(Boolean));
      filtered = filtered.filter((i) => idSet.has(i.ad_id));
    }

    if (dateFrom) {
      filtered = filtered.filter((i) => i.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((i) => i.date <= dateTo);
    }

    return paginate(filtered, page);
  });
}
