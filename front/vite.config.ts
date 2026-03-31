import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:6300";

  return {
    root: "src",

    base: "/conway-gol/",

    publicDir: "../public",

    server: {
      proxy: {
        "/conway-gol/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/conway-gol\/api/, ""),
        },
      },
    },

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

    css: {
      transformer: "lightningcss",
    },

    build: {
      cssMinify: "lightningcss",
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
