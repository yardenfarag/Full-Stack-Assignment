import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { campaignsRoutes } from "./routes/campaigns.js";
import { adsRoutes } from "./routes/ads.js";
import { creativesRoutes } from "./routes/creatives.js";
import { insightsRoutes } from "./routes/insights.js";
import { checkRandomError, delay, RESPONSE_DELAY_MS } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");

function loadJSON<T>(filename: string): T {
  const raw = readFileSync(join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: "active" | "inactive";
  campaign_objective: string;
}

export interface Ad {
  ad_id: string;
  campaign_id: string;
  creative_id: string;
  date_start: string;
  date_end: string;
  name: string;
  description: string;
  status: "active" | "inactive";
}

export interface Creative {
  creative_id: string;
  creative_type: "image" | "video";
  thumbnail_url: string;
}

export interface Insight {
  insight_id: string;
  date: string;
  ad_id: string;
  campaign_id: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  video_views: number;
  leads: number;
  conversion_value: number;
}

// Type augmentation for decorators
declare module "fastify" {
  interface FastifyInstance {
    data: {
      campaigns: Campaign[];
      ads: Ad[];
      creatives: Creative[];
      insights: Insight[];
    };
  }
}

async function main() {
  const campaigns = loadJSON<Campaign[]>("campaigns.json");
  const ads = loadJSON<Ad[]>("ads.json");
  const creatives = loadJSON<Creative[]>("creatives.json");
  const insights = loadJSON<Insight[]>("insights.json");

  console.log(
    `Loaded data: ${campaigns.length} campaigns, ${ads.length} ads, ${creatives.length} creatives, ${insights.length} insights`
  );

  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });

  // Random errors: ~10% return 500, ~5% return 429
  server.addHook("onRequest", async (_request, reply) => {
    const result = checkRandomError();
    if (result.shouldError) {
      reply.code(result.statusCode!).send(result.body);
    }
  });

  server.decorate("data", { campaigns, ads, creatives, insights });

  await server.register(campaignsRoutes, { prefix: "/api" });
  await server.register(adsRoutes, { prefix: "/api" });
  await server.register(creativesRoutes, { prefix: "/api" });
  await server.register(insightsRoutes, { prefix: "/api" });

  // 5-second delay before every successful response
  server.addHook("onSend", async (_request, reply, payload) => {
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      await delay(RESPONSE_DELAY_MS);
    }
    return payload;
  });

  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Data server running on http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
