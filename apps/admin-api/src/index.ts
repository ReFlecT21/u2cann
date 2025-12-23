import "dotenv/config";

import { log } from "@adh/logger";

import { createServer } from "./server";

const port = process.env.PORT ?? 3002;
const server = createServer();

server.listen(port, () => {
  log(`api running on ${port}`);
});
