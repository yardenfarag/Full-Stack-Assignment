import { readFileSync } from "fs";
import { join } from "path";

interface Config {
  ports: {
    dataServer: number;
    server: number;
    client: number;
    postgres: number;
  };
}

const raw = readFileSync(join(process.cwd(), "..", "config.json"), "utf-8");
export const config: Config = JSON.parse(raw);
