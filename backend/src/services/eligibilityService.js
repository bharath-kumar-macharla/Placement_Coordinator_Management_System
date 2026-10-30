import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Deterministic eligibility rule engine.
 * Rules are evaluated against confirmed drive_criteria only.
 * Does NOT call AI — fully deterministic.
 *
 * @param {object} studentProfile
 * @param {object} criteria - drive_criteria row
 * @param {Date} now - current time (injectable for testing)
 * @returns {{ eligible: boolean, reasons: Array<{rule, passed, detail}> }}
 */
export function checkStudentEligibility(studentProfile, criteria, now = new Date()) {
  const reasons = [];

  // ── Rule 1: CGPA ───────────────────────────────────────────
  if (criteria.min_cgpa !== null && criteria.min_cgpa !== undefined) {
    const cgpa = parseFloat(studentProfile.cgpa ?? 0);
    const passed = cgpa >= criteria.min_cgpa;
    reasons.push({
      rule: "min_cgpa",
      passed,
      detail: passed
        ? `CGPA ${cgpa} meets the minimum ${criteria.min_cgpa}`
        : `CGPA ${cgpa} is below the minimum ${criteria.min_cgpa}`,
    });
  }

  // ── Rule 2: Backlogs ───────────────────────────────────────
  if (criteria.max_backlogs !== null && criteria.max_backlogs !== undefined) {
    const backlogs = parseInt(studentProfile.backlogs ?? 0, 10);
    const passed = backlogs <= criteria.max_backlogs;
    reasons.push({
      rule: "max_backlogs",
      passed,
      detail: passed
        ? `${backlogs} backlogs is within the maximum of ${criteria.max_backlogs}`
        : `${backlogs} backlogs exceeds the maximum of ${criteria.max_backlogs}`,
    });
  }

  // ── Rule 3: Branch ─────────────────────────────────────────
  if (criteria.allowed_branches && criteria.allowed_branches.length > 0) {
    const branch = studentProfile.branch ?? "";
    const passed = criteria.allowed_branches
      .map((b) => b.toLowerCase())
      .includes(branch.toLowerCase());
    reasons.push({
      rule: "branch",
      passed,
      detail: passed
        ? `Branch '${branch}' is allowed`
        : `Branch '${branch}' is not in the allowed branches: ${criteria.allowed_branches.join(", ")}`,
    });
  }

  // ── Rule 4: Year ───────────────────────────────────────────
  if (criteria.allowed_years && criteria.allowed_years.length > 0) {
    const year = parseInt(studentProfile.year ?? 0, 10);
    const passed = criteria.allowed_years.includes(year);
    reasons.push({
      rule: "year",
      passed,
      detail: passed
        ? `Year ${year} is allowed`
        : `Year ${year} is not in the allowed years: ${criteria.allowed_years.join(", ")}`,
    });
  }

  // ── Rule 5: Mandatory Skills ───────────────────────────────
  if (criteria.mandatory_skills && criteria.mandatory_skills.length > 0) {
    const studentSkills = (studentProfile.skills ?? []).map((s) => s.toLowerCase());
    const missing = criteria.mandatory_skills.filter(
      (s) => !studentSkills.includes(s.toLowerCase())
    );
    const passed = missing.length === 0;
    reasons.push({
      rule: "mandatory_skills",
      passed,
      detail: passed
        ? `All mandatory skills present: ${criteria.mandatory_skills.join(", ")}`
        : `Missing mandatory skills: ${missing.join(", ")}`,
    });
  }

  const eligible = reasons.every((r) => r.passed);
  return { eligible, reasons };
}

/**
 * Run eligibility for ALL students in the system against a specific drive.
 * Writes (or updates) application rows with status='eligible' for eligible students.
 * Returns preview counts when dryRun=true (does NOT write to DB).
 *
 * @param {string} driveId
 * @param {object} actorUser - { id, role }
 * @param {boolean} [dryRun=false]
 */
export async function runEligibility(driveId, actorUser, dryRun = false) {
  // Load drive + criteria
  const { data: drive, error: driveErr } = await supabase
    .from("drives")
    .select("*, drive_criteria(*)")
    .eq("id", driveId)
    .maybeSingle();
  if (driveErr || !drive) throw new ApiError(404, "Drive not found");
  if (!drive.criteria_confirmed)
    throw new ApiError(400, "Criteria must be confirmed before running eligibility");

  const criteria = drive.drive_criteria;
  if (!criteria) throw new ApiError(400, "Drive has no criteria configured");

  // Load all active students with profiles
  const { data: students, error: studErr } = await supabase
    .from("student_profiles")
    .select("*, users!inner(id, name, email, is_active, role)")
    .eq("users.is_active", true)
    .eq("users.role", "student");
  if (studErr) throw new ApiError(500, studErr.message);

  const results = { eligible: [], ineligible: [] };
  const inserts = [];

  for (const sp of students ?? []) {
    const userId = sp.user_id ?? sp.users?.id;
    const result = checkStudentEligibility(sp, criteria);

    const entry = {
      drive_id:     driveId,
      student_id:   userId,
      status:       result.eligible ? "eligible" : "rejected",
      status_reason: result.eligible
        ? null
        : result.reasons.filter((r) => !r.passed).map((r) => r.detail).join("; "),
    };

    if (result.eligible) {
      results.eligible.push({ student: sp, reasons: result.reasons });
    } else {
      results.ineligible.push({ student: sp, reasons: result.reasons });
    }

    inserts.push(entry);
  }

  if (!dryRun) {
    // Upsert applications — idempotent
    for (const row of inserts) {
      await supabase
        .from("applications")
        .upsert(row, { onConflict: "drive_id,student_id" });
    }
    logger.info(`Eligibility run complete for drive ${driveId}`, {
      eligible: results.eligible.length,
      ineligible: results.ineligible.length,
    });
  }

  return {
    driveId,
    dryRun,
    eligibleCount:   results.eligible.length,
    ineligibleCount: results.ineligible.length,
    eligible:        results.eligible,
    ineligible:      results.ineligible,
  };
}
