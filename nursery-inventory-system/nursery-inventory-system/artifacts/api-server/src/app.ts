import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Explicit allow-list for CORS with credentials.
// Requests with no origin (same-origin, server-to-server) are always permitted.
const allowedOrigins = new Set(
  [
    process.env["FRONTEND_URL"],
    "http://localhost:5000",
    "http://localhost:19556",
    "http://localhost:5173",
  ].filter(Boolean) as string[],
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / curl / Postman — no Origin header
      if (!origin) return callback(null, true);
      // Explicit allow-list
      if (allowedOrigins.has(origin)) return callback(null, true);
      // Replit preview proxy (*.replit.dev, *.replit.app) — port suffix allowed
      if (/^https:\/\/[^/]+\.replit\.(dev|app)(:\d+)?$/.test(origin))
        return callback(null, true);
      // Reject everything else when credentials are involved
      return callback(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());
// Raised from the default 100kb so base64-encoded logo/photo uploads
// (Settings module) fit within a single JSON request body.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;
