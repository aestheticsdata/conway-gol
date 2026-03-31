/** Payload values for GET /health (`status` and `database` JSON fields) */
export const STATUS = {
  OK: "ok",
  ERROR: "error",
  DATABASE: {
    UP: "up",
    DOWN: "down",
  },
} as const;
