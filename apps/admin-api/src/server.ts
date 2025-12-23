import type { Express } from "express";
import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";


export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(clerkMiddleware())
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors({ origin: "*" }))
    .get("/", requireAuth(), (req, res) => {
      const userId = getAuth(req);
      return res.json({ userId });
    })

    .get("/health", (_, res) => {
      return res.json({ ok: true });
    });

  return app;
};
