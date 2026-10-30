import pLimit from "p-limit";
import { supabase } from "../config/supabase.js";
import { scoreMatch } from "./geminiService.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

const CONCURRENCY = 3; // max parallel Gemini calls

/**
 * Run AI match scoring for all applied students in a drive.
 * Idempotent — re-running updates existing scores.
 *
 * @param {string} driveId
 * @returns {Promise<{processed: number, skipped: number}>}
 */
export async function runMatchScoring(driveId) {
  // Load drive + criteria + JD
  const { data: drive } = await supabase
    .from("drives")
    .select("*, drive_criteria(*)")
    .eq("id", driveId)
    .maybeSingle();
  if (!drive) throw new ApiError(404, "Drive not found");

  const criteria = drive.drive_criteria;

  // Load applied (or eligible) applications for this drive
  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, student_id, match_score, status")
    .eq("drive_id", driveId)
    .in("status", ["applied", "eligible", "shortlisted"]);
  if (error) throw new ApiError(500, error.message);

  const limit = pLimit(CONCURRENCY);
  let processed = 0;
  let skipped = 0;

  await Promise.all(
    (applications ?? []).map((app) =>
      limit(async () => {
        // Load student profile — only data needed for this student
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("branch, year, cgpa, backlogs, skills, resume_text, projects, certifications")
          .eq("user_id", app.student_id)
          .maybeSingle();

        if (!sp) {
          skipped++;
          return;
        }

        const result = await scoreMatch(sp, criteria, drive.jd_text);
        if (!result.ok) {
          logger.warn("Match scoring failed for application", { appId: app.id, error: result.error });
          skipped++;
          return;
        }

        await supabase
          .from("applications")
          .update({
            match_score: result.data.match_score,
            skill_gap:   {
              matched_skills: result.data.matched_skills,
              missing_skills: result.data.missing_skills,
              strengths:      result.data.strengths,
            },
            ai_reason:   result.data.reasoning,
          })
          .eq("id", app.id);

        processed++;
      })
    )
  );

  logger.info(`Match scoring complete for drive ${driveId}`, { processed, skipped });
  return { processed, skipped };
}
