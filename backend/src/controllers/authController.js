import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auditLog } from "../services/auditService.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

/** POST /api/auth/register — students only */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check for duplicate email
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) throw new ApiError(409, "Email is already registered");

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from("users")
    .insert({ name, email, password_hash, role: "student" })
    .select("id, name, email, role, is_active, created_at")
    .single();
  if (error) throw new ApiError(500, "Failed to create user: " + error.message);

  // Create empty student profile
  await supabase.from("student_profiles").insert({ user_id: user.id });

  await auditLog(null, "USER_REGISTERED", "users", user.id, null, { email, role: "student" });

  const token = signToken(user);
  res.status(201).json({ token, user });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, password_hash")
    .eq("email", email)
    .maybeSingle();

  // Constant-time comparison to prevent timing attacks
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!valid) throw new ApiError(401, "Invalid email or password");
  if (!user.is_active) throw new ApiError(403, "Account is disabled. Contact an administrator.");

  const { password_hash: _ph, ...safeUser } = user;
  const token = signToken(safeUser);
  res.json({ token, user: safeUser });
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, created_at, updated_at")
    .eq("id", req.user.id)
    .single();
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user });
});
