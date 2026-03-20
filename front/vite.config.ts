import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

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
        "@cell": resolve(__dirname, "src/Cell"),
        "@controls": resolve(__dirname, "src/controls"),
        "@data": resolve(__dirname, "src/data"),
        "@grid": resolve(__dirname, "src/Grid"),
        "@helpers": resolve(__dirname, "src/helpers"),
        "@services": resolve(__dirname, "src/services"),
      },
    },

    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
