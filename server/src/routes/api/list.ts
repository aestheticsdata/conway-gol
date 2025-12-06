import { listController } from "#routes/controllers/listController.js";

import type { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", listController);
}
