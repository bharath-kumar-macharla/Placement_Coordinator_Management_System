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
      // Allow requests with no origin (curl, Postman, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
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

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/students",      studentRoutes);
app.use("/api/companies",     companyRoutes);
app.use("/api/drives",        driveRoutes);
app.use("/api/applications",  applicationRoutes);
app.use("/api",               applicationRoutes); // mounts /api/drives/:id/apply, /api/drives/:id/shortlist, /api/drives/:id/shortlist/approve
app.use("/api",               scheduleRoutes);   // mounts /api/drives/:id/schedule/* and /api/slots/*
app.use("/api/notifications", notificationRoutes);
app.use("/api",               assistantRoutes);  // /api/applications/:id/resume-feedback etc.
app.use("/api/reports",       reportRoutes);
app.use("/api/admin",         adminRoutes);

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
