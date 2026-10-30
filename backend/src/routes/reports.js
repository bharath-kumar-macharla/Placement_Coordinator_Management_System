import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { getDriveReport, getSkillGapAnalytics, reportToCSV } from "../services/reportService.js";

const router = Router();
router.use(authenticate, requireRole("coordinator", "admin"));

// ── GET /api/reports/drive/:id ────────────────────────────────────────────────
router.get("/drive/:id", asyncHandler(async (req, res) => {
  const report = await getDriveReport(req.params.id);
  res.json(report);
}));

// ── GET /api/reports/drive/:id.csv ────────────────────────────────────────────
router.get("/drive/:id.csv", asyncHandler(async (req, res) => {
  const report = await getDriveReport(req.params.id);
  const csv = reportToCSV(report);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="drive-${req.params.id}-report.csv"`);
  res.send(csv);
}));

// ── GET /api/reports/skill-gap ────────────────────────────────────────────────
router.get("/skill-gap", asyncHandler(async (req, res) => {
  const data = await getSkillGapAnalytics();
  res.json({ skillGap: data.byBranch, topMissingSkills: data.topMissingSkills });
}));

// ── GET /api/reports/overview ─────────────────────────────────────────────────
router.get("/overview", asyncHandler(async (req, res) => {
  const { data: drives } = await supabase
    .from("drives")
    .select("id, title, status, companies(name)");

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id, drive_id, student_id, status, match_score, status_reason, ai_reason, created_at,
      drives(id, title, companies(name)),
      student_profiles(roll_no, branch, cgpa, backlogs, skills, users(name, email))
    `)
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("users")
    .select("id")
    .eq("role", "student");

  const { data: companies } = await supabase
    .from("companies")
    .select("id");

  const allApps = applications ?? [];
  const totalShortlisted = allApps.filter((a) => a.status === "shortlisted").length;
  const totalRejected    = allApps.filter((a) => a.status === "rejected").length;
  const totalApplied     = allApps.filter((a) => a.status === "applied").length;
  const totalPlaced      = allApps.filter((a) => a.status === "selected").length;

  res.json({
    totalDrives:        drives?.length ?? 0,
    totalStudents:      students?.length ?? 0,
    totalCompanies:     companies?.length ?? 0,
    totalApplications:  allApps.length,
    totalShortlisted,
    totalRejected,
    totalApplied,
    totalPlaced,
    drives: drives ?? [],
    recentDecisions: allApps,
  });
}));

export default router;
