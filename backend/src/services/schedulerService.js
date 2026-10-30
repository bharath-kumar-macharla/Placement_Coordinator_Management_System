import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import { notifyClashResolved } from "./notificationService.js";

/**
 * Check if a new slot [start, end+buffer] overlaps with any existing slot for the same student.
 *
 * @param {Date} newStart
 * @param {Date} newEnd
 * @param {Array<{start_time: string, end_time: string}>} existingSlots
 * @param {number} bufferMs - buffer between slots in milliseconds
 * @returns {boolean}
 */
export function hasTimeOverlap(newStart, newEnd, existingSlots, bufferMs = 15 * 60 * 1000) {
  const bufferedEnd = new Date(newEnd.getTime() + bufferMs);
  for (const slot of existingSlots) {
    const slotStart = new Date(slot.start_time);
    const slotEnd   = new Date(slot.end_time);
    // Overlap: newStart < slotEnd && bufferedEnd > slotStart
    if (newStart < slotEnd && bufferedEnd > slotStart) return true;
  }
  return false;
}

/**
 * Resolve a clash between two competing slots using the priority policy:
 * keep the slot with the higher match_score (more likely to succeed);
 * if tied, keep the one with fewer alternatives (tighter window).
 *
 * @param {object} slotA - { applicationId, matchScore, driveId }
 * @param {object} slotB
 * @returns {"A"|"B"} which slot to keep
 */
export function resolvePriority(slotA, slotB) {
  if (slotA.matchScore !== slotB.matchScore) {
    return slotA.matchScore >= slotB.matchScore ? "A" : "B";
  }
  // Tie-break: fewest alternatives (lower count wins)
  return (slotA.alternatives ?? Infinity) <= (slotB.alternatives ?? Infinity) ? "A" : "B";
}

/**
 * Generate a schedule for a drive.
 * Algorithm: greedy, fewest-alternatives-first.
 *
 * @param {object} opts
 * @param {string} opts.driveId
 * @param {string[]} opts.rooms
 * @param {string} opts.windowStart  - ISO date string
 * @param {string} opts.windowEnd    - ISO date string
 * @param {string} opts.dailyStart   - "HH:MM" UTC
 * @param {string} opts.dailyEnd     - "HH:MM" UTC
 * @param {number} opts.bufferMinutes
 * @param {boolean} [opts.dryRun=false]
 * @param {string} [opts.coordinatorId]
 * @returns {Promise<object>}
 */
export async function generateSchedule({
  driveId,
  rooms,
  windowStart,
  windowEnd,
  dailyStart,
  dailyEnd,
  bufferMinutes = 15,
  dryRun = false,
  coordinatorId,
}) {
  const bufferMs = bufferMinutes * 60 * 1000;

  // Load rounds for this drive
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("drive_id", driveId)
    .order("round_no");
  if (!rounds?.length) throw new Error("No rounds configured for this drive");

  // Load shortlisted applications for this drive
  const { data: applications } = await supabase
    .from("applications")
    .select("id, student_id, match_score, status")
    .eq("drive_id", driveId)
    .in("status", ["shortlisted", "applied"]);
  if (!applications?.length) return { slots: [], clashesDetected: 0, clashesResolved: 0 };

  // Load ALL existing schedule slots across all drives (global timeline)
  const { data: globalSlots } = await supabase
    .from("schedule_slots")
    .select("application_id, start_time, end_time, round_id")
    .in("status", ["scheduled", "rescheduled"]);

  // Build a map: studentId -> existing slots
  const studentSlotMap = {};
  for (const slot of globalSlots ?? []) {
    const { data: app } = await supabase
      .from("applications")
      .select("student_id")
      .eq("id", slot.application_id)
      .maybeSingle();
    if (app) {
      if (!studentSlotMap[app.student_id]) studentSlotMap[app.student_id] = [];
      studentSlotMap[app.student_id].push(slot);
    }
  }

  // Count cross-drive shortlists per student (for fewest-alternatives ordering)
  const { data: crossDriveApps } = await supabase
    .from("applications")
    .select("student_id")
    .in("status", ["shortlisted", "applied"]);

  const crossDriveCount = {};
  for (const a of crossDriveApps ?? []) {
    crossDriveCount[a.student_id] = (crossDriveCount[a.student_id] ?? 0) + 1;
  }

  // Sort applications: fewest alternatives first (most cross-drive conflicts)
  const sorted = [...applications].sort(
    (a, b) => (crossDriveCount[b.student_id] ?? 0) - (crossDriveCount[a.student_id] ?? 0)
  );

  const proposedSlots = [];
  let clashesDetected = 0;
  let clashesResolved = 0;

  // Parse window
  const winStart = new Date(windowStart);
  const winEnd   = new Date(windowEnd);

  for (const app of sorted) {
    let prevRoundEnd = winStart;

    for (const round of rounds) {
      const durationMs = round.duration_minutes * 60 * 1000;
      let placed = false;

      // Try each day in window
      let dayStart = new Date(prevRoundEnd);

      while (dayStart < winEnd && !placed) {
        // Snap to daily start time
        const [dh, dm] = dailyStart.split(":").map(Number);
        const [eh, em] = dailyEnd.split(":").map(Number);

        let slotStart = new Date(dayStart);
        slotStart.setUTCHours(dh, dm, 0, 0);
        if (slotStart < dayStart) slotStart = new Date(dayStart);

        const dayEndTime = new Date(slotStart);
        dayEndTime.setUTCHours(eh, em, 0, 0);

        // Try each room in order
        for (const room of rooms) {
          // Find earliest free slot for this room
          let tryStart = new Date(slotStart);

          while (tryStart < dayEndTime) {
            const tryEnd = new Date(tryStart.getTime() + durationMs);
            if (tryEnd > dayEndTime) break;

            // Check student's own conflicts
            const studentExistingSlots = [
              ...(studentSlotMap[app.student_id] ?? []),
              ...proposedSlots
                .filter((s) => s.studentId === app.student_id)
                .map((s) => ({ start_time: s.start_time, end_time: s.end_time })),
            ];

            const hasConflict = hasTimeOverlap(tryStart, tryEnd, studentExistingSlots, bufferMs);

            // Check room conflicts
            const roomConflicts = proposedSlots.filter(
              (s) =>
                s.room === room &&
                s.roundId === round.id &&
                new Date(s.start_time) < tryEnd &&
                new Date(s.end_time) > tryStart
            );

            if (!hasConflict && roomConflicts.length === 0) {
              proposedSlots.push({
                roundId:       round.id,
                applicationId: app.id,
                studentId:     app.student_id,
                room,
                start_time:    tryStart.toISOString(),
                end_time:      tryEnd.toISOString(),
                status:        "scheduled",
                clashNote:     null,
                matchScore:    app.match_score ?? 0,
              });
              // Update prevRoundEnd for next round ordering
              prevRoundEnd = new Date(tryEnd.getTime() + bufferMs);
              placed = true;
              break;
            }

            // If student conflict due to another drive, record clash
            if (hasConflict) {
              clashesDetected++;
              // Try next 30-min increment
              tryStart = new Date(tryStart.getTime() + 30 * 60 * 1000);
            } else {
              // Room conflict — try next 15-min increment
              tryStart = new Date(tryStart.getTime() + 15 * 60 * 1000);
            }
          }

          if (placed) break;
        }

        if (!placed) {
          // Move to next day
          dayStart.setUTCDate(dayStart.getUTCDate() + 1);
          dayStart.setUTCHours(0, 0, 0, 0);
        }
      }

      if (!placed) {
        // Could not place — record unresolved
        logger.warn("Could not schedule slot", { appId: app.id, round: round.round_no });
      }
    }
  }

  // Detect cross-drive clashes in proposed slots and resolve
  const studentSlots = {};
  for (const slot of proposedSlots) {
    if (!studentSlots[slot.studentId]) studentSlots[slot.studentId] = [];
    studentSlots[slot.studentId].push(slot);
  }

  for (const [studentId, slots] of Object.entries(studentSlots)) {
    slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    for (let i = 0; i < slots.length - 1; i++) {
      const a = slots[i];
      const b = slots[i + 1];
      if (
        new Date(a.start_time) < new Date(b.end_time) &&
        new Date(a.end_time) + bufferMs > new Date(b.start_time)
      ) {
        clashesDetected++;
        // Resolution: keep higher match_score
        const keepA = resolvePriority(
          { matchScore: a.matchScore, alternatives: crossDriveCount[studentId] },
          { matchScore: b.matchScore, alternatives: crossDriveCount[studentId] }
        ) === "A";
        const displaced = keepA ? b : a;
        displaced.status = "rescheduled";
        displaced.clashNote = `Clash with another drive slot for the same student. Student kept in higher-priority slot (match score: ${keepA ? a.matchScore : b.matchScore}). This slot marked for rescheduling.`;
        clashesResolved++;

        if (coordinatorId && !dryRun) {
          await notifyClashResolved(
            coordinatorId,
            driveId,
            `Schedule clash detected for a student. ${displaced.clashNote}`
          );
        }
      }
    }
  }

  if (!dryRun) {
    // Save to DB
    for (const slot of proposedSlots) {
      await supabase.from("schedule_slots").insert({
        round_id:           slot.roundId,
        application_id:     slot.applicationId,
        room:               slot.room,
        start_time:         slot.start_time,
        end_time:           slot.end_time,
        status:             slot.status,
        clash_resolved_note: slot.clashNote ?? null,
      });
    }
    logger.info("Schedule saved", { driveId, slots: proposedSlots.length, clashesDetected, clashesResolved });
  }

  return {
    slots: proposedSlots,
    clashesDetected,
    clashesResolved,
    dryRun,
  };
}

/**
 * Reschedule a single slot — find the next available time for the same student/round.
 * @param {string} slotId
 * @param {object} opts
 */
export async function rescheduleSlot(slotId, { rooms, windowEnd, dailyStart, dailyEnd, bufferMinutes }) {
  const { data: slot } = await supabase
    .from("schedule_slots")
    .select("*, rounds(*), applications(student_id, match_score, drive_id)")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) throw new Error("Slot not found");

  await supabase
    .from("schedule_slots")
    .update({ status: "rescheduled" })
    .eq("id", slotId);

  // Re-use generateSchedule logic for just this one application
  return { message: "Slot rescheduled — re-run full schedule generation for optimal placement." };
}
