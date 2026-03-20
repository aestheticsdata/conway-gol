import path from "node:path";
import { registerAs } from "@nestjs/config";

export interface AppConfig {
  port: number;
  catalogDir: string;
}

export default registerAs(
  "app",
  (): AppConfig => ({
    port: Number.parseInt(process.env.PORT ?? "", 10),
    catalogDir: path.resolve(process.env.CATALOG_DIR ?? ""),
  }),
);
