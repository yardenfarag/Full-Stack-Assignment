import { readFileSync } from "fs";
import { join } from "path";

interface Config {
  ports: {
    dataServer: number;
    server: number;
    client: number;
    postgres: number;
  };
  server: {
    host: string;
    baseUrl: string;
  };
  endpoints: {
    sync: string;
    syncStatus: string;
    performance: string;
    columns: string;
  };
}

export const DATA_SERVER_BASE_URL = "http://localhost:3001/api";
const raw = readFileSync(join(process.cwd(), "..", "config.json"), "utf-8");
export const config: Config = JSON.parse(raw);
