import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./trpc";
import { setupVite, serveStatic } from "./vite";

async function start() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "3000", 10);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`grammerfixer3000 running → http://localhost:${PORT}`);
  });
}

start().catch(console.error);
