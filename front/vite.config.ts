import { defineConfig } from "vite";

export default defineConfig({
  root: "src",

  base: "/conway-gol/",

  publicDir: "../public",

  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
