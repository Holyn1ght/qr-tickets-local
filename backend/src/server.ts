import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import os from "node:os";
import { app } from "./app";
import { env } from "./config/env";
import "./db/database";
import { logger } from "./utils/logger";

const ensureRequiredPaths = () => {
  fs.mkdirSync(env.ticketsStorageDir, { recursive: true });

  const backgroundDir = path.dirname(env.ticketBackgroundPath);
  fs.mkdirSync(backgroundDir, { recursive: true });
};

const getNetworkAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const [interfaceName, entries] of Object.entries(interfaces)) {
    if (!entries) {
      continue;
    }
    for (const entry of entries) {
      if (entry.internal || entry.family !== "IPv4") {
        continue;
      }
      addresses.push(`${interfaceName}: http://${entry.address}:${env.port}`);
    }
  }

  return addresses;
};

const bootstrap = async () => {
  ensureRequiredPaths();

  const server = http.createServer(app);

  server.on("error", (error) => {
    logger.error("HTTP server error", {
      message: error.message,
      name: error.name,
    });
  });

  server.listen(env.port, env.host, () => {
    const networkUrls = getNetworkAddresses();
    logger.info("Backend started", {
      host: env.host,
      port: env.port,
      localUrl: `http://localhost:${env.port}`,
      clientOrigin: env.clientOrigin,
      networkUrls,
    });
  });
};

bootstrap().catch((error) => {
  logger.error("Backend bootstrap failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
