import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

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
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/*.e2e-spec.ts", "src/main.ts"],
    },
  },
});
