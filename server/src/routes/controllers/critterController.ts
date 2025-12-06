import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { FastifyRequest, FastifyReply } from "fastify";

export const critterController = async (
  request: FastifyRequest<{ Params: { name: string } }>,
  reply: FastifyReply
) => {
  try {
    const { name } = request.params;
    let file;

    if (name.includes("-custom")) {
      const customName = name.split("-custom")[0];
      const filePath = path.join(
        __dirname,
        "../../species/user-custom",
        `${customName}.hxf`
      );
      file = await fs.readFile(filePath, "utf-8");
    } else {
      // Force lowercase for standard species to avoid Linux case-sensitivity issues
      const standardName = name.toLowerCase();
      const filePath = path.join(
        __dirname,
        "../../species",
        `${standardName}.hxf`
      );
      file = await fs.readFile(filePath, "utf-8");
    }

    return reply.type('text/plain').send(file);
  } catch (err) {
    console.log(err);
    reply.code(500).send(err);
  }
};
