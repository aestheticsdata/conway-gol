import Fastify from "fastify";
import cors from "@fastify/cors";

import listRoutes from "#routes/api/list.js";
import critterRoutes from "#routes/api/critter.js";
import userCustomRoutes from "#routes/api/usercustom.js";

const server = Fastify({
  logger: true,
});

server.register(cors, {
  // origin: true // default is true, allowing all origins
});

server.register(listRoutes, { prefix: "/list" });
server.register(critterRoutes, { prefix: "/critter" });
server.register(userCustomRoutes, { prefix: "/usercustom" });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "5030");
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Server started on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
