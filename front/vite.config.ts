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

    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
