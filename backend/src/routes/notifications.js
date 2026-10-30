import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
router.use(authenticate);

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const { data: notifications, count } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  res.json({ notifications: notifications ?? [], total: count ?? 0 });
}));

// ── GET /api/notifications/unread-count ──────────────────────────────────────
router.get("/unread-count", asyncHandler(async (req, res) => {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", req.user.id)
    .eq("is_read", false);

  res.json({ count: count ?? 0 });
}));

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
router.put("/:id/read", asyncHandler(async (req, res) => {
  const { data: notif } = await supabase
    .from("notifications")
    .select("id, user_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!notif) throw new ApiError(404, "Notification not found");
  if (notif.user_id !== req.user.id) throw new ApiError(403, "Forbidden");

  await supabase.from("notifications").update({ is_read: true }).eq("id", req.params.id);
  res.json({ ok: true });
}));

// ── PUT /api/notifications/read-all ──────────────────────────────────────────
router.put("/read-all", asyncHandler(async (req, res) => {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", req.user.id)
    .eq("is_read", false);
  res.json({ ok: true });
}));

export default router;
