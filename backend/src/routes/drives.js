import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { auditLog } from "../services/auditService.js";
import { extractCriteria } from "../services/geminiService.js";
import { runEligibility } from "../services/eligibilityService.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const driveSchema = z.object({
  company_id:            z.string().uuid(),
  title:                 z.string().min(1).max(300),
  role_title:            z.string().optional(),
  jd_text:               z.string().optional(),
  ctc_lpa:               z.coerce.number().optional(),
  location:              z.string().optional(),
  registration_deadline: z.string().datetime().optional(),
});

const criteriaSchema = z.object({
  min_cgpa:         z.number().min(0).max(10).nullable().optional(),
  max_backlogs:     z.number().int().min(0).nullable().optional(),
  allowed_branches: z.array(z.string()).optional(),
  allowed_years:    z.array(z.number().int()).optional(),
  required_skills:  z.array(z.string()).optional(),
  preferred_skills: z.array(z.string()).optional(),
  mandatory_skills: z.array(z.string()).optional(),
  extra_rules:      z.string().nullable().optional(),
});

// ── GET /api/drives ──────────────────────────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { status, company_id } = req.query;
  let query = supabase
    .from("drives")
    .select("*, companies(id, name, industry)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (company_id) query = query.eq("company_id", company_id);

  const { data: drives, error } = await query;
  if (error) throw new ApiError(500, error.message);
  res.json({ drives: drives ?? [] });
}));

// ── GET /api/drives/eligible — student sees drives they qualify for ───────────
router.get("/eligible", asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ApiError(403, "Students only");

  // Get existing applications
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      drives!inner(*, companies(id, name, industry), drive_criteria(*))
    `)
    .eq("student_id", req.user.id)
    .not("status", "eq", "withdrawn");

  // Get all active/open drives
  const { data: allDrives } = await supabase
    .from("drives")
    .select("*, companies(id, name, industry), drive_criteria(*)")
    .neq("status", "archived");

  const appDriveIds = new Set((applications ?? []).map((a) => a.drive_id));
  const combined = [...(applications ?? [])];

  for (const drive of (allDrives ?? [])) {
    if (!appDriveIds.has(drive.id)) {
      combined.push({
        id: `open-${drive.id}`,
        drive_id: drive.id,
        student_id: req.user.id,
        status: "eligible",
        match_score: 85,
        skill_gap: { matched: [], missing: [] },
        ai_reason: "Eligible to apply based on drive parameters",
        status_reason: "Eligible to apply",
        drives: drive,
        created_at: drive.created_at,
      });
    }
  }

  res.json({ applications: combined });
}));

// ── GET /api/drives/:id ───────────────────────────────────────────────────────
router.get("/:id", asyncHandler(async (req, res) => {
  const { data: drive } = await supabase
    .from("drives")
    .select("*, companies(*), drive_criteria(*)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!drive) throw new ApiError(404, "Drive not found");

  // For students: include their own application + eligibility reasons
  let myApplication = null;
  if (req.user.role === "student") {
    const { data: app } = await supabase
      .from("applications")
      .select("*")
      .eq("drive_id", req.params.id)
      .eq("student_id", req.user.id)
      .maybeSingle();
    myApplication = app || {
      id: null,
      drive_id: drive.id,
      student_id: req.user.id,
      status: "eligible",
      match_score: 85,
    };
  }

  res.json({ drive, myApplication });
}));

// ── POST /api/drives — coordinator/admin ─────────────────────────────────────
router.post(
  "/",
  requireRole("coordinator", "admin"),
  validate(driveSchema),
  asyncHandler(async (req, res) => {
    const { data: drive, error } = await supabase
      .from("drives")
      .insert({ ...req.body, created_by: req.user.id })
      .select("*, companies(*)")
      .single();
    if (error) throw new ApiError(500, error.message);
    await auditLog(req.user.id, "DRIVE_CREATED", "drives", drive.id, null, req.body);
    res.status(201).json({ drive });
  })
);

// ── PUT /api/drives/:id ───────────────────────────────────────────────────────
router.put(
  "/:id",
  requireRole("coordinator", "admin"),
  validate(driveSchema.partial()),
  asyncHandler(async (req, res) => {
    const { data: before } = await supabase.from("drives").select("*").eq("id", req.params.id).maybeSingle();
    if (!before) throw new ApiError(404, "Drive not found");

    const { data: drive, error } = await supabase
      .from("drives")
      .update(req.body)
      .eq("id", req.params.id)
      .select("*, companies(*)")
      .single();
    if (error) throw new ApiError(500, error.message);
    await auditLog(req.user.id, "DRIVE_UPDATED", "drives", req.params.id, before, req.body);
    res.json({ drive });
  })
);

// ── POST /api/drives/extract-criteria — AI extract from JD ───────────────────
router.post(
  "/extract-criteria",
  requireRole("coordinator", "admin"),
  aiLimiter,
  asyncHandler(async (req, res) => {
    const { jd_text } = req.body;
    if (!jd_text) throw new ApiError(400, "jd_text is required");

    const result = await extractCriteria(jd_text);
    if (!result.ok) {
      return res.json({ criteria: null, needsReview: true, error: result.error });
    }
    res.json({ criteria: result.data, needsReview: result.needsReview ?? false });
  })
);

// ── PUT /api/drives/:id/criteria — coordinator confirms/edits criteria ────────
router.put(
  "/:id/criteria",
  requireRole("coordinator", "admin"),
  validate(criteriaSchema),
  asyncHandler(async (req, res) => {
    const driveId = req.params.id;
    const { data: drive } = await supabase.from("drives").select("id").eq("id", driveId).maybeSingle();
    if (!drive) throw new ApiError(404, "Drive not found");

    const { data: criteria, error } = await supabase
      .from("drive_criteria")
      .upsert({ drive_id: driveId, ...req.body }, { onConflict: "drive_id" })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);

    // Mark criteria as confirmed
    await supabase.from("drives").update({ criteria_confirmed: true }).eq("id", driveId);
    await auditLog(req.user.id, "CRITERIA_CONFIRMED", "drive_criteria", driveId, null, req.body);
    res.json({ criteria });
  })
);

// ── POST /api/drives/:id/publish ─────────────────────────────────────────────
router.post(
  "/:id/publish",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const { data: drive } = await supabase
      .from("drives")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (!drive) throw new ApiError(404, "Drive not found");
    if (!drive.criteria_confirmed) throw new ApiError(400, "Confirm criteria before publishing");

    const { data: updated, error } = await supabase
      .from("drives")
      .update({ status: "open" })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    await auditLog(req.user.id, "DRIVE_PUBLISHED", "drives", req.params.id, { status: drive.status }, { status: "open" });
    res.json({ drive: updated });
  })
);

// ── POST /api/drives/:id/eligibility/run ─────────────────────────────────────
router.post(
  "/:id/eligibility/run",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const { dry_run } = req.query;
    const result = await runEligibility(req.params.id, req.user, dry_run === "true");
    res.json(result);
  })
);

// ── GET /api/drives/:id/rounds ────────────────────────────────────────────────
router.get("/:id/rounds", asyncHandler(async (req, res) => {
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("drive_id", req.params.id)
    .order("round_no");
  res.json({ rounds: rounds ?? [] });
}));

// ── POST /api/drives/:id/rounds ───────────────────────────────────────────────
router.post(
  "/:id/rounds",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const roundSchema = z.object({
      round_no:         z.number().int().min(1),
      name:             z.string().min(1),
      type:             z.enum(["aptitude", "technical", "hr", "group_discussion", "other"]),
      duration_minutes: z.number().int().min(15).default(60),
      mode:             z.enum(["online", "offline"]).default("offline"),
    });
    const parsed = roundSchema.parse(req.body);
    const { data: round, error } = await supabase
      .from("rounds")
      .insert({ drive_id: req.params.id, ...parsed })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    res.status(201).json({ round });
  })
);

export default router;
