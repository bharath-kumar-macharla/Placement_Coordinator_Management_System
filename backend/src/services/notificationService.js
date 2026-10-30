import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Create transporter lazily (only if SMTP is configured)
let transporter = null;
function getTransporter() {
  if (!transporter && env.SMTP_HOST) {
    transporter = nodemailer.createTransporter({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Create an in-app notification for a user.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} [opts.driveId]
 * @param {string} opts.type
 * @param {string} opts.title
 * @param {string} opts.body
 */
export async function createNotification({ userId, driveId, type, title, body }) {
  const { error } = await supabase.from("notifications").insert({
    user_id:  userId,
    drive_id: driveId ?? null,
    type,
    title,
    body,
  });
  if (error) logger.warn("Failed to create notification", { userId, type, error: error.message });
}

/**
 * Send optional email notification (silently skipped if SMTP not configured).
 */
export async function sendEmail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    logger.debug("SMTP not configured — skipping email", { to, subject });
    return;
  }
  try {
    await t.sendMail({ from: env.SMTP_FROM, to, subject, text });
    logger.info("Email sent", { to, subject });
  } catch (err) {
    logger.warn("Failed to send email", { to, subject, error: err.message });
  }
}

/**
 * Notify a student about a status change on their application.
 */
export async function notifyStatusChange(application, toStatus, reason) {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", application.student_id)
    .maybeSingle();
  if (!user) return;

  const statusLabels = {
    shortlisted: "You have been shortlisted! 🎉",
    selected:    "Congratulations! You have been selected! 🏆",
    rejected:    "Application Status Update",
    round_1:     "You have been moved to Round 1",
    round_2:     "You have been moved to Round 2",
    round_3:     "You have been moved to Round 3",
  };

  const title = statusLabels[toStatus] ?? `Status updated to: ${toStatus}`;
  const body = reason
    ? `Your application status has been updated to '${toStatus}'. Reason: ${reason}`
    : `Your application status has been updated to '${toStatus}'.`;

  await createNotification({
    userId:  user.id,
    driveId: application.drive_id,
    type:    "STATUS_CHANGE",
    title,
    body,
  });

  await sendEmail({ to: user.email, subject: title, text: body });
}

/**
 * Notify a student that a schedule has been published or changed.
 */
export async function notifySchedulePublished(studentId, driveId, scheduleInfo) {
  await createNotification({
    userId:  studentId,
    driveId,
    type:    "SCHEDULE_PUBLISHED",
    title:   "Your interview schedule has been published",
    body:    `Your interview is scheduled for ${scheduleInfo}. Check the Schedule tab for details.`,
  });
}

/**
 * Notify a student about a drive they are eligible for.
 */
export async function notifyEligibleDrive(studentId, drive, matchScore) {
  await createNotification({
    userId:  studentId,
    driveId: drive.id,
    type:    "NEW_ELIGIBLE_DRIVE",
    title:   `New drive: ${drive.title}`,
    body:    `You are eligible for the ${drive.title} drive${matchScore ? ` with a match score of ${matchScore}%` : ""}. Apply before the deadline!`,
  });
}

/**
 * Notify coordinator that a clash was detected and resolved.
 */
export async function notifyClashResolved(coordinatorId, driveId, note) {
  await createNotification({
    userId:  coordinatorId,
    driveId,
    type:    "CLASH_RESOLVED",
    title:   "Schedule clash detected and resolved",
    body:    note,
  });
}
