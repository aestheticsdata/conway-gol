import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { FastifyRequest, FastifyReply } from "fastify";

export const listController = async (
  request: FastifyRequest<{ Querystring: { subdir?: string } }>,
  reply: FastifyReply
) => {
  try {
    const subdir = request.query.subdir ?? "";
    const dirPath = path.join(__dirname, "../../species", subdir);
    const files = await fs.readdir(dirPath);
    const names = files
      .map((filename) => filename.split(".")[0])
      .filter((filename) => {
        return subdir === "" ? filename !== "" : true;
      });
    return names;
  } catch (err) {
    console.log(err);
    reply.code(500).send(err);
  }
};
