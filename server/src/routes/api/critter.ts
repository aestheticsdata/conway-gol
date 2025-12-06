import { critterController } from "#routes/controllers/critterController.js";

import type { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance) {
  fastify.get("/:name", critterController);
}
