import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@app": resolve(__dirname, "src/app"),
      "@assets": resolve(__dirname, "src/assets"),
      "@cell": resolve(__dirname, "src/simulation/cell"),
      "@data": resolve(__dirname, "src/data"),
      "@grid": resolve(__dirname, "src/simulation/grid"),
      "@infra": resolve(__dirname, "src/platform/infra"),
      "@navigation": resolve(__dirname, "src/app/navigation"),
      "@router": resolve(__dirname, "src/app/router"),
      "@services": resolve(__dirname, "src/platform/services"),
      "@simulation": resolve(__dirname, "src/app/simulation"),
      "@texts": resolve(__dirname, "src/texts/appTexts.ts"),
      "@lib": resolve(__dirname, "src/lib"),
      "@ui": resolve(__dirname, "src/ui"),
      "@views": resolve(__dirname, "src/app/views"),
      "@conway/shared": resolve(__dirname, "../api-nest/src/shared"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
