import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();
router.use(authenticate, requireRole("admin"));

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get("/users", asyncHandler(async (req, res) => {
  const { role, is_active } = req.query;
  let query = supabase.from("users").select("id, name, email, role, is_active, created_at").order("created_at", { ascending: false });
  if (role) query = query.eq("role", role);
  if (is_active !== undefined) query = query.eq("is_active", is_active === "true");
  const { data: users, error } = await query;
  if (error) throw new ApiError(500, error.message);
  res.json({ users: users ?? [] });
}));

// ── POST /api/admin/users — create coordinator/admin ─────────────────────────
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name:     z.string().min(2),
      email:    z.string().email(),
      password: z.string().min(8),
      role:     z.enum(["coordinator", "admin"]),
    });
    const { name, email, password, role } = schema.parse(req.body);
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) throw new ApiError(409, "Email already registered");
    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase.from("users").insert({ name, email, password_hash, role }).select("id, name, email, role, is_active").single();
    if (error) throw new ApiError(500, error.message);
    res.status(201).json({ user });
  })
);

// ── PUT /api/admin/users/:id/status ──────────────────────────────────────────
router.put("/:id/status", asyncHandler(async (req, res) => {
  const { is_active } = z.object({ is_active: z.boolean() }).parse(req.body);
  const { data: user, error } = await supabase
    .from("users")
    .update({ is_active })
    .eq("id", req.params.id)
    .select("id, name, email, role, is_active")
    .single();
  if (error) throw new ApiError(500, error.message);
  res.json({ user });
}));

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
router.get("/audit-logs", asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, entity_type, actor_id } = req.query;
  let query = supabase
    .from("audit_logs")
    .select("*, users(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (entity_type) query = query.eq("entity_type", entity_type);
  if (actor_id) query = query.eq("actor_id", actor_id);

  const { data: logs, count, error } = await query;
  if (error) throw new ApiError(500, error.message);
  res.json({ logs: logs ?? [], total: count ?? 0 });
}));

export default router;
