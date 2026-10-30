import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { generateSchedule, rescheduleSlot } from "../services/schedulerService.js";
import { notifySchedulePublished } from "../services/notificationService.js";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const scheduleConfigSchema = z.object({
  rooms:          z.array(z.string()).min(1),
  windowStart:    z.string().datetime(),
  windowEnd:      z.string().datetime(),
  dailyStart:     z.string().regex(/^\d{2}:\d{2}$/),
  dailyEnd:       z.string().regex(/^\d{2}:\d{2}$/),
  bufferMinutes:  z.number().int().min(5).default(15),
});

// ── POST /api/drives/:id/schedule/generate — preview only ────────────────────
router.post(
  "/drives/:id/schedule/generate",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const config = scheduleConfigSchema.parse(req.body);
    const result = await generateSchedule({
      driveId: req.params.id,
      ...config,
      dryRun: true,
      coordinatorId: req.user.id,
    });
    res.json(result);
  })
);

// ── POST /api/drives/:id/schedule/confirm — save ─────────────────────────────
router.post(
  "/drives/:id/schedule/confirm",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const config = scheduleConfigSchema.parse(req.body);
    const result = await generateSchedule({
      driveId: req.params.id,
      ...config,
      dryRun: false,
      coordinatorId: req.user.id,
    });

    // Update drive status to scheduled
    await supabase.from("drives").update({ status: "scheduled" }).eq("id", req.params.id);

    // Notify all scheduled students
    const studentIds = [...new Set(result.slots.map((s) => s.studentId))];
    for (const studentId of studentIds) {
      const studentSlots = result.slots.filter((s) => s.studentId === studentId);
      const nextSlot = studentSlots.find((s) => s.status === "scheduled");
      if (nextSlot) {
        const dateStr = new Date(nextSlot.start_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        await notifySchedulePublished(studentId, req.params.id, `${dateStr} in ${nextSlot.room}`);
      }
    }

    res.json(result);
  })
);

// ── GET /api/drives/:id/schedule ─────────────────────────────────────────────
router.get("/drives/:id/schedule", asyncHandler(async (req, res) => {
  const { data: slots } = await supabase
    .from("schedule_slots")
    .select(`
      *,
      rounds!inner(round_no, name, type, mode, duration_minutes, drive_id),
      applications!inner(student_id, status, match_score)
    `)
    .eq("rounds.drive_id", req.params.id)
    .order("start_time");

  // Students see only their own slots
  let filtered = slots ?? [];
  if (req.user.role === "student") {
    filtered = filtered.filter((s) => s.applications.student_id === req.user.id);
  }

  res.json({ slots: filtered });
}));

// ── POST /api/schedule/:slotId/reschedule ────────────────────────────────────
router.post(
  "/slots/:slotId/reschedule",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const result = await rescheduleSlot(req.params.slotId, req.body);
    res.json(result);
  })
);

// ── POST /api/drives/:id/schedule/rebalance ──────────────────────────────────
router.post(
  "/drives/:id/schedule/rebalance",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    // Delete existing scheduled slots for this drive and regenerate
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id")
      .eq("drive_id", req.params.id);

    if (rounds?.length) {
      const roundIds = rounds.map((r) => r.id);
      await supabase.from("schedule_slots").delete().in("round_id", roundIds);
    }

    const config = scheduleConfigSchema.parse(req.body);
    const result = await generateSchedule({
      driveId: req.params.id,
      ...config,
      dryRun: false,
      coordinatorId: req.user.id,
    });
    res.json(result);
  })
);

// ── GET /api/students/schedule — student's own schedule ──────────────────────
router.get("/students/my-schedule", asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ApiError(403, "Students only");

  const { data: apps } = await supabase
    .from("applications")
    .select("id")
    .eq("student_id", req.user.id);

  if (!apps?.length) return res.json({ slots: [] });
  const appIds = apps.map((a) => a.id);

  const { data: slots } = await supabase
    .from("schedule_slots")
    .select(`*, rounds(round_no, name, type, mode, duration_minutes, drives(title, companies(name)))`)
    .in("application_id", appIds)
    .order("start_time");

  res.json({ slots: slots ?? [] });
}));

export default router;
