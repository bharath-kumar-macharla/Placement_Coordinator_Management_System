import { supabase } from "../config/supabase.js";
import { createNotification } from "./notificationService.js";
import { logger } from "../utils/logger.js";

/**
 * Idempotent deadline reminder service.
 * Sends reminders at 48h and 6h before registration deadline.
 * Tracks sent reminders in applications.reminders_sent JSONB to avoid duplicates.
 */
export async function runDeadlineReminders() {
  const now = new Date();
  const reminders = [
    { key: "48h", hoursAhead: 48 },
    { key: "6h",  hoursAhead: 6 },
  ];

  let sent = 0;
  let skipped = 0;

  for (const { key, hoursAhead } of reminders) {
    const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // ±30 min window
    const windowEnd   = new Date(targetTime.getTime() + 30 * 60 * 1000);

    // Find drives whose deadline falls in this window
    const { data: drives } = await supabase
      .from("drives")
      .select("id, title, registration_deadline")
      .eq("status", "open")
      .gte("registration_deadline", windowStart.toISOString())
      .lte("registration_deadline", windowEnd.toISOString());

    for (const drive of drives ?? []) {
      // Find eligible-but-unapplied students
      const { data: apps } = await supabase
        .from("applications")
        .select("id, student_id, reminders_sent")
        .eq("drive_id", drive.id)
        .eq("status", "eligible");

      for (const app of apps ?? []) {
        const alreadySent = app.reminders_sent?.[key];
        if (alreadySent) {
          skipped++;
          continue;
        }

        await createNotification({
          userId:  app.student_id,
          driveId: drive.id,
          type:    "DEADLINE_REMINDER",
          title:   `⏰ Reminder: ${drive.title} deadline in ${hoursAhead} hours`,
          body:    `The registration deadline for ${drive.title} is in ${hoursAhead} hours. Don't miss your chance to apply!`,
        });

        // Mark reminder as sent (idempotent)
        const updatedReminders = { ...(app.reminders_sent ?? {}), [key]: now.toISOString() };
        await supabase
          .from("applications")
          .update({ reminders_sent: updatedReminders })
          .eq("id", app.id);

        sent++;
        logger.debug("Deadline reminder sent", { studentId: app.student_id, driveId: drive.id, key });
      }
    }
  }

  return { sent, skipped };
}
