import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { auditLog } from "../services/auditService.js";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const profileSchema = z.object({
  name:           z.string().min(2).max(100).optional(),
  roll_no:        z.string().optional(),
  branch:         z.string().optional(),
  year:           z.coerce.number().int().min(1).max(2035).optional(),
  cgpa:           z.coerce.number().min(0).max(10).optional(),
  backlogs:       z.coerce.number().int().min(0).optional(),
  skills:         z.array(z.string()).optional(),
  resume_text:    z.string().optional(),
  resume_url:     z.string().url().optional().or(z.literal("")),
  phone:          z.string().optional(),
  linkedin:       z.string().optional(),
  projects:       z.array(z.object({ name: z.string(), description: z.string().optional(), url: z.string().optional() })).optional(),
  certifications: z.array(z.string()).optional(),
});

/** GET /api/students/me */
router.get("/me", asyncHandler(async (req, res) => {
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, created_at")
    .eq("id", req.user.id)
    .single();

  res.json({ user, profile: profile ?? {} });
}));

/** PUT /api/students/me */
router.put("/me", validate(profileSchema), asyncHandler(async (req, res) => {
  const { name, ...profileFields } = req.body;

  // Update user name if provided
  if (name) {
    await supabase.from("users").update({ name }).eq("id", req.user.id);
  }

  // Upsert student profile
  const { data: profile, error } = await supabase
    .from("student_profiles")
    .upsert({ user_id: req.user.id, ...profileFields }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw new ApiError(500, "Failed to update profile: " + error.message);

  await auditLog(req.user.id, "PROFILE_UPDATED", "student_profiles", req.user.id, null, profileFields);
  res.json({ profile });
}));

/** GET /api/students — coordinator/admin only, with filters */
router.get(
  "/",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const { branch, year, min_cgpa, max_cgpa, search } = req.query;
    let query = supabase
      .from("student_profiles")
      .select(`
        *,
        users!inner(id, name, email, is_active)
      `)
      .eq("users.is_active", true);

    if (branch) query = query.eq("branch", branch);
    if (year) query = query.eq("year", Number(year));
    if (min_cgpa) query = query.gte("cgpa", Number(min_cgpa));
    if (max_cgpa) query = query.lte("cgpa", Number(max_cgpa));
    if (search) {
      query = query.or(
        `users.name.ilike.%${search}%,users.email.ilike.%${search}%,roll_no.ilike.%${search}%`
      );
    }

    const { data: students, error } = await query;
    if (error) throw new ApiError(500, error.message);
    res.json({ students: students ?? [] });
  })
);

/** GET /api/students/my-schedule — student's interview schedule slots */
router.get("/my-schedule", asyncHandler(async (req, res) => {
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

/** GET /api/students/:id — coordinator/admin */
router.get(
  "/:id",
  requireRole("coordinator", "admin"),
  asyncHandler(async (req, res) => {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select(`*, users!inner(id, name, email, is_active, created_at)`)
      .eq("user_id", req.params.id)
      .maybeSingle();
    if (!profile) throw new ApiError(404, "Student not found");
    res.json({ profile });
  })
);

/** POST /api/students/resume-analyze — standalone resume parser & ATS evaluator */
router.post(
  "/resume-analyze",
  asyncHandler(async (req, res) => {
    const { resume_text } = req.body;
    if (!resume_text || !resume_text.trim()) {
      throw new ApiError(400, "Please provide resume text to analyze.");
    }

    const text = resume_text.trim();
    // 1. Detect skills from a comprehensive skill dictionary
    const KNOWN_SKILLS = [
      "JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "Java", "Spring Boot",
      "C", "C++", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Docker", "Kubernetes", "AWS", "Git",
      "GitHub", "Tailwind CSS", "HTML", "CSS", "AutoCAD", "SolidWorks", "ANSYS", "MATLAB",
      "Embedded Systems", "IoT", "Linux", "REST APIs", "GraphQL", "Redux", "Data Structures", "Algorithms"
    ];

    const detectedSkills = KNOWN_SKILLS.filter((s) => {
      const reg = new RegExp(`\\b${s.replace("+", "\\+").replace(".", "\\.")}\\b`, "i");
      return reg.test(text);
    });

    // 2. Assess ATS compatibility based on structural cues
    let atsScore = 65;
    const hasEducation = /education|b\.?tech|b\.?e|cgpa|gpa|degree/i.test(text);
    const hasProjects = /project|developed|built|designed|implemented/i.test(text);
    const hasExperience = /intern|work|experience|role|trainee/i.test(text);
    const hasMetrics = /\b\d+%\b|\b\d+\s*users\b|\b\d+\s*ms\b|\b\d+\s*stars\b|\b400\+\b|\b30\+\b/i.test(text);

    if (hasEducation) atsScore += 8;
    if (hasProjects) atsScore += 10;
    if (hasExperience) atsScore += 7;
    if (hasMetrics) atsScore += 10;
    if (detectedSkills.length >= 6) atsScore += 5;
    atsScore = Math.min(atsScore, 98);

    // 3. Construct actionable feedback
    const suggestions = [];
    if (!hasMetrics) {
      suggestions.push({
        section: "Projects",
        issue: "Lacks quantifiable metrics",
        suggestion: "Quantify your impact (e.g. 'reduced latency by 40%', 'used by 500+ active users').",
        priority: "high"
      });
    }
    if (!text.toLowerCase().includes("git") && !text.toLowerCase().includes("docker")) {
      suggestions.push({
        section: "Tools",
        issue: "DevOps / Version Control not highlighted",
        suggestion: "Add Git, GitHub, Docker, or CI/CD pipelines to demonstrate production readiness.",
        priority: "medium"
      });
    }
    if (text.length < 300) {
      suggestions.push({
        section: "Length",
        issue: "Resume description is too brief",
        suggestion: "Elaborate on architectural decisions, database schemas, and problem-solving steps.",
        priority: "medium"
      });
    }

    const improvedBullets = [
      "Designed and deployed responsive web modules using React & Tailwind, cutting page load time by 35%.",
      "Architected RESTful APIs with Node.js and PostgreSQL, implementing JWT authentication for secure session management.",
      "Conducted finite element analysis (FEA) and stress testing in ANSYS, verifying safety factor standards of 2.5."
    ];

    res.json({
      analysis: {
        ats_score: atsScore,
        detected_skills: detectedSkills,
        suggestions,
        strengths: [
          `Detected ${detectedSkills.length} core technical competencies.`,
          hasProjects ? "Solid project portfolio demonstrating hands-on implementation." : "Found clear academic credentials.",
          hasMetrics ? "Strong usage of quantifiable achievement metrics." : "Structured section organization."
        ],
        improved_bullet_examples: improvedBullets,
      }
    });
  })
);

export default router;

