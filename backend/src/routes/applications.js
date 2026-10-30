import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { auditLog } from "../services/auditService.js";
import { notifyStatusChange } from "../services/notificationService.js";
import { runMatchScoring } from "../services/matchService.js";

const router = Router();
router.use(authenticate);

/** Write an application_events row for every status change */
async function recordStatusEvent(applicationId, fromStatus, toStatus, reason, actorId) {
  await supabase.from("application_events").insert({
    application_id: applicationId,
    from_status:    fromStatus,
    to_status:      toStatus,
    reason:         reason ?? null,
    actor_id:       actorId ?? null,
  });
}

// ── POST /api/drives/:id/apply ────────────────────────────────────────────────
router.post("/drives/:id/apply", asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ApiError(403, "Students only");

  // Check existing application
  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("drive_id", req.params.id)
    .eq("student_id", req.user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "rejected") throw new ApiError(403, "You are not eligible for this drive");
    if (existing.status !== "eligible") throw new ApiError(409, "Already applied or in a later stage");

    const { data: app, error } = await supabase
      .from("applications")
      .update({ status: "applied" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);

    await recordStatusEvent(existing.id, "eligible", "applied", "Student applied", req.user.id);
    return res.status(200).json({ application: app });
  }

  // Create new application
  const { data: app, error } = await supabase
    .from("applications")
    .insert({
      drive_id: req.params.id,
      student_id: req.user.id,
      status: "applied",
      match_score: 85,
      status_reason: "Student applied directly",
    })
    .select()
    .single();
  if (error) throw new ApiError(500, error.message);

  await recordStatusEvent(app.id, "eligible", "applied", "Student applied", req.user.id);
  res.status(201).json({ application: app });
}));

// ── DELETE /api/drives/:id/apply — withdraw ───────────────────────────────────
router.delete("/drives/:id/apply", asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ApiError(403, "Students only");

  const { data: app } = await supabase
    .from("applications")
    .select("id, status")
    .eq("drive_id", req.params.id)
    .eq("student_id", req.user.id)
    .maybeSingle();

  if (!app) throw new ApiError(404, "Application not found");
  if (!["eligible", "applied"].includes(app.status))
    throw new ApiError(400, "Cannot withdraw at this stage");

  await supabase.from("applications").update({ status: "withdrawn" }).eq("id", app.id);
  await recordStatusEvent(app.id, app.status, "withdrawn", "Student withdrew", req.user.id);
  res.status(204).send();
}));

// ── GET /api/applications/mine ────────────────────────────────────────────────
router.get("/mine", asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ApiError(403, "Students only");

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      drives!inner(id, title, status, registration_deadline, companies(name, industry))
    `)
    .eq("student_id", req.user.id)
    .order("created_at", { ascending: false });

  res.json({ applications: applications ?? [] });
}));

// ── GET /api/applications/:id/timeline ───────────────────────────────────────
router.get("/:id/timeline", asyncHandler(async (req, res) => {
  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id, drive_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!app) throw new ApiError(404, "Application not found");

  // Students can only see their own timelines
  if (req.user.role === "student" && app.student_id !== req.user.id)
    throw new ApiError(403, "Forbidden");

  const { data: events } = await supabase
    .from("application_events")
    .select("*, users(name, role)")
    .eq("application_id", req.params.id)
    .order("at");

  res.json({ timeline: events ?? [] });
}));

// ── GET /api/drives/:id/shortlist — ranked list ───────────────────────────────
// ── GET /api/drives/:id/shortlist — ranked list ───────────────────────────────
router.get("/drives/:id/shortlist", requireRole("coordinator", "admin"), asyncHandler(async (req, res) => {
  const { status } = req.query;
  let query = supabase
    .from("applications")
    .select(`
      *,
      student_profiles!inner(
        branch, year, cgpa, backlogs, skills,
        users!inner(id, name, email)
      )
    `)
    .eq("drive_id", req.params.id)
    .order("match_score", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: apps, error } = await query;
  if (error) throw new ApiError(500, error.message);

  res.json({ shortlist: apps ?? [], candidates: apps ?? [] });
}));

// ── POST /api/drives/:id/shortlist/approve ────────────────────────────────────
router.post(
  "/drives/:id/shortlist/approve",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const { approvedIds = [], rejectedIds = [], selectedIds = [], reasonOverrides = {} } = req.body;

    for (const id of approvedIds) {
      const { data: app } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
      if (!app) continue;

      await supabase.from("applications").update({
        status: "shortlisted",
        coordinator_approved: true,
        status_reason: reasonOverrides[id] ?? null,
      }).eq("id", id);

      await recordStatusEvent(id, app.status, "shortlisted", reasonOverrides[id] ?? "Approved by coordinator", req.user.id);
      await auditLog(req.user.id, "SHORTLIST_APPROVED", "applications", id, { status: app.status }, { status: "shortlisted" });
      await notifyStatusChange(app, "shortlisted", reasonOverrides[id]);
    }

    for (const id of selectedIds) {
      const { data: app } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
      if (!app) continue;

      await supabase.from("applications").update({
        status: "selected",
        coordinator_approved: true,
        status_reason: reasonOverrides[id] ?? "Selected: Placement offer extended.",
      }).eq("id", id);

      await recordStatusEvent(id, app.status, "selected", reasonOverrides[id] ?? "Candidate Selected / Offer Extended", req.user.id);
      await auditLog(req.user.id, "CANDIDATE_SELECTED", "applications", id, { status: app.status }, { status: "selected" });
      await notifyStatusChange(app, "selected", reasonOverrides[id]);
    }

    for (const id of rejectedIds) {
      const { data: app } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
      if (!app) continue;

      await supabase.from("applications").update({
        status: "rejected",
        coordinator_approved: false,
        status_reason: reasonOverrides[id] ?? "Not shortlisted in this round",
      }).eq("id", id);

      await recordStatusEvent(id, app.status, "rejected", reasonOverrides[id] ?? "Not shortlisted", req.user.id);
      await auditLog(req.user.id, "SHORTLIST_REJECTED", "applications", id, { status: app.status }, { status: "rejected" });
      await notifyStatusChange(app, "rejected", reasonOverrides[id]);
    }

    // Trigger match scoring for newly shortlisted
    if (approvedIds.length > 0) {
      runMatchScoring(req.params.id).catch(() => {}); // non-blocking
    }

    res.json({
      approvedCount: approvedIds.length,
      selectedCount: selectedIds.length,
      rejectedCount: rejectedIds.length,
    });
  })
);

// ── PUT /api/applications/:id/status ──────────────────────────────────────────
router.put("/:id/status", requireRole("coordinator", "admin"), asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!status) throw new ApiError(400, "status is required");

  const { data: app } = await supabase.from("applications").select("*").eq("id", req.params.id).maybeSingle();
  if (!app) throw new ApiError(404, "Application not found");

  const updatePayload = {
    status,
    status_reason: reason ?? app.status_reason,
    coordinator_approved: ["shortlisted", "selected", "round_1", "round_2", "round_3"].includes(status),
  };

  const { data: updated, error } = await supabase
    .from("applications")
    .update(updatePayload)
    .eq("id", req.params.id);

  if (error) throw new ApiError(500, error.message);

  await recordStatusEvent(req.params.id, app.status, status, reason ?? `Status changed to ${status}`, req.user.id);
  await auditLog(req.user.id, "STATUS_UPDATE", "applications", req.params.id, { status: app.status }, { status });
  await notifyStatusChange(app, status, reason);

  res.json({ application: { ...app, ...updatePayload } });
}));

// ── GET /api/applications (coordinator: all for a drive) ─────────────────────
router.get("/", requireRole("coordinator", "admin"), asyncHandler(async (req, res) => {
  const { drive_id, status } = req.query;
  if (!drive_id) throw new ApiError(400, "drive_id query param required");

  let query = supabase
    .from("applications")
    .select(`
      *,
      student_profiles!inner(branch, year, cgpa, backlogs, skills,
        users!inner(id, name, email)
      )
    `)
    .eq("drive_id", drive_id);

  if (status) query = query.eq("status", status);
  query = query.order("match_score", { ascending: false });

  const { data: applications, error } = await query;
  if (error) throw new ApiError(500, error.message);
  res.json({ applications: applications ?? [] });
}));

export default router;
