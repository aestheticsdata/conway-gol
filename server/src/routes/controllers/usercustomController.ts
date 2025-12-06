import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { FastifyRequest, FastifyReply } from "fastify";

export const usercustomController = async (
  request: FastifyRequest<{ Params: { filename: string }; Body: any }>,
  reply: FastifyReply
) => {
  try {
    const { filename } = request.params;
    await fs.writeFile(
      path.join(__dirname, "../../species/user-custom", `${filename}.hxf`),
      JSON.stringify(request.body)
    );
    reply.code(200).send({ msg: `${filename} saved` });
  } catch (err) {
    console.log(err);
    reply.code(500).send(err);
  }
};
