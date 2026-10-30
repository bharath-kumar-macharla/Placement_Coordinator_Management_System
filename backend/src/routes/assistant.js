import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { resumeFeedback, interviewPrep, answerStudentQuery } from "../services/geminiService.js";
import { aiLimiter } from "../middleware/rateLimit.js";

const router = Router();
router.use(authenticate, aiLimiter);

// ── POST /api/applications/:id/resume-feedback ───────────────────────────────
router.post("/applications/:id/resume-feedback", asyncHandler(async (req, res) => {
  let app = null;
  let jdText = "";
  let criteria = null;
  let studentId = req.user.id;

  // 1. Try finding application by ID
  const { data: foundApp } = await supabase
    .from("applications")
    .select("*, drives(*, drive_criteria(*))")
    .eq("id", req.params.id)
    .maybeSingle();

  if (foundApp) {
    app = foundApp;
    studentId = foundApp.student_id;
    jdText = foundApp.drives?.jd_text || "";
    criteria = foundApp.drives?.drive_criteria;
  } else {
    // 2. Check if parameter is drive ID
    const { data: drive } = await supabase
      .from("drives")
      .select("*, drive_criteria(*)")
      .eq("id", req.params.id)
      .maybeSingle();

    if (drive) {
      jdText = drive.jd_text || "";
      criteria = drive.drive_criteria;
    } else {
      throw new ApiError(404, "Application or Drive not found");
    }
  }

  if (req.user.role === "student" && studentId !== req.user.id) {
    throw new ApiError(403, "Forbidden");
  }

  const { data: sp } = await supabase
    .from("student_profiles")
    .select("resume_text, skills, projects, certifications")
    .eq("user_id", studentId)
    .maybeSingle();

  const resumeText = sp?.resume_text || "B.Tech Student with skills in Software Engineering, Web Development, and Programming.";

  const result = await resumeFeedback(resumeText, jdText, criteria);
  if (!result.ok) {
    return res.json({ feedback: null, needsReview: true, error: result.error });
  }

  if (app?.id) {
    await supabase.from("applications").update({ resume_feedback: result.data }).eq("id", app.id);
  }

  res.json({ feedback: result.data });
}));

// ── POST /api/drives/:id/interview-prep ──────────────────────────────────────
router.post("/drives/:id/interview-prep", asyncHandler(async (req, res) => {
  const { data: drive } = await supabase
    .from("drives")
    .select("title, role_title, jd_text, companies(name), drive_criteria(*)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!drive) throw new ApiError(404, "Drive not found");

  // Get student's skill gap for this drive
  let missingSkills = [];
  if (req.user.role === "student") {
    const { data: app } = await supabase
      .from("applications")
      .select("skill_gap")
      .eq("drive_id", req.params.id)
      .eq("student_id", req.user.id)
      .maybeSingle();
    missingSkills = app?.skill_gap?.missing_skills ?? [];
  }

  const result = await interviewPrep(
    drive.companies?.name ?? drive.title,
    drive.role_title ?? drive.title,
    missingSkills
  );

  if (!result.ok) {
    return res.json({ prep: null, needsReview: true, error: result.error });
  }
  res.json({ prep: result.data });
}));

// ── POST /api/assistant/query ─────────────────────────────────────────────────
router.post("/assistant/query", asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ApiError(403, "Students only");
  const { question } = req.body;
  if (!question?.trim()) throw new ApiError(400, "question is required");

  // Build context — student's applications, upcoming schedule, drive details
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id, status, match_score, status_reason,
      drives(id, title, status, registration_deadline, companies(name))
    `)
    .eq("student_id", req.user.id)
    .not("status", "eq", "withdrawn");

  const { data: mySlots } = await supabase
    .from("schedule_slots")
    .select(`
      start_time, end_time, room, status,
      rounds(round_no, name, type, mode, drives(title))
    `)
    .in(
      "application_id",
      (applications ?? []).map((a) => a.id)
    )
    .eq("status", "scheduled")
    .order("start_time");

  const context = {
    applications: (applications ?? []).map((a) => ({
      drive:  a.drives?.title,
      company: a.drives?.companies?.name,
      status: a.status,
      matchScore: a.match_score,
      deadline: a.drives?.registration_deadline,
    })),
    upcomingSchedule: (mySlots ?? []).slice(0, 5).map((s) => ({
      drive:     s.rounds?.drives?.title,
      round:     s.rounds?.name,
      roundNo:   s.rounds?.round_no,
      mode:      s.rounds?.mode,
      room:      s.room,
      startTime: s.start_time,
      endTime:   s.end_time,
    })),
  };

  const result = await answerStudentQuery(question, context);
  res.json({ answer: result.data ?? result.error ?? "I couldn't process your question." });
}));

export default router;
