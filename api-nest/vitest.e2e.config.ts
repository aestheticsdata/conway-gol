import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/** E2E: mêmes alias que vitest.config.ts ; fichiers sous test/ avec suffixe .e2e-spec.ts */
export default defineConfig({
  resolve: {
    alias: {
      "@app": resolve(__dirname, "src"),
      "@config": resolve(__dirname, "src/config"),
      "@health": resolve(__dirname, "src/health"),
      "@patterns": resolve(__dirname, "src/patterns"),
      "@db": resolve(__dirname, "src/prisma"),
      "@generated": resolve(__dirname, "generated"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./test/vitest-setup.ts"],
    include: ["test/**/*.e2e-spec.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
