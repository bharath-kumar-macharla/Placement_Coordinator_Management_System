import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

/**
 * Write an audit log entry.
 * Errors are intentionally swallowed so a logging failure never breaks the main flow.
 *
 * @param {string|null} actorId
 * @param {string} action
 * @param {string} entityType
 * @param {string} entityId
 * @param {object|null} before
 * @param {object|null} after
 */
export async function auditLog(actorId, action, entityType, entityId, before, after) {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: actorId ?? null,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      before: before ?? null,
      after: after ?? null,
    });
  } catch (err) {
    logger.warn("auditLog: failed to write audit entry", { action, entityType, entityId, err: err.message });
  }
}
