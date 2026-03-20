const path = require("node:path");

const NEST_DIR = __dirname;

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "conway-gol-api",
      cwd: NEST_DIR,
      script: "dist/src/main.js",
      node_args: "-r tsconfig-paths/register",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        TS_NODE_BASEURL: "./dist",
        PORT: Number(process.env.PORT || 6300),
        CATALOG_DIR: process.env.CATALOG_DIR || path.join(NEST_DIR, "data/patterns"),
        ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
      },
    },
  ],
};
