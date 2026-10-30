// Load and validate environment variables FIRST — before any other import
import "./src/config/env.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cron from "node-cron";

import { env } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { generalLimiter } from "./src/middleware/rateLimit.js";

// Routes
import authRoutes         from "./src/routes/auth.js";
import studentRoutes      from "./src/routes/students.js";
import companyRoutes      from "./src/routes/companies.js";
import driveRoutes        from "./src/routes/drives.js";
import applicationRoutes  from "./src/routes/applications.js";
import scheduleRoutes     from "./src/routes/schedule.js";
import notificationRoutes from "./src/routes/notifications.js";
import assistantRoutes    from "./src/routes/assistant.js";
import reportRoutes       from "./src/routes/reports.js";
import adminRoutes        from "./src/routes/admin.js";

// Deadline reminder cron
import { runDeadlineReminders } from "./src/services/reminderCron.js";

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = env.CLIENT_URL.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, health checks) or matching origin
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api", generalLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── API Routes (mounted under both /api and root for maximum client compatibility) ──
const apiRouter = express.Router();
apiRouter.use("/auth",          authRoutes);
apiRouter.use("/students",      studentRoutes);
apiRouter.use("/companies",     companyRoutes);
apiRouter.use("/drives",        driveRoutes);
apiRouter.use("/applications",  applicationRoutes);
apiRouter.use("/",              applicationRoutes); // mounts /drives/:id/apply, /drives/:id/shortlist, /drives/:id/shortlist/approve
apiRouter.use("/",              scheduleRoutes);    // mounts /drives/:id/schedule/* and /slots/*
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/",              assistantRoutes);   // /applications/:id/resume-feedback etc.
apiRouter.use("/reports",       reportRoutes);
apiRouter.use("/admin",         adminRoutes);

app.use("/api", apiRouter);
app.use("/", apiRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// ── Central error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} (${env.NODE_ENV})`);
  logger.info(`📋 Health: http://localhost:${PORT}/health`);
});

// ── Deadline reminder cron — runs every hour ──────────────────────────────────
cron.schedule("0 * * * *", async () => {
  logger.info("⏰ Running deadline reminder cron...");
  try {
    const result = await runDeadlineReminders();
    logger.info("Deadline reminders sent", result);
  } catch (err) {
    logger.error("Deadline reminder cron failed", { error: err.message });
  }
});

export default app;
