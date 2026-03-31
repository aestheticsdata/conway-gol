import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@app": resolve(__dirname, "src/app"),
      "@assets": resolve(__dirname, "src/assets"),
      "@cell": resolve(__dirname, "src/Cell"),
      "@data": resolve(__dirname, "src/data"),
      "@grid": resolve(__dirname, "src/Grid"),
      "@helpers": resolve(__dirname, "src/helpers"),
      "@infra": resolve(__dirname, "src/infra"),
      "@navigation": resolve(__dirname, "src/app/navigation"),
      "@router": resolve(__dirname, "src/app/router"),
      "@services": resolve(__dirname, "src/services"),
      "@simulation": resolve(__dirname, "src/app/simulation"),
      "@texts": resolve(__dirname, "src/texts.ts"),
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
