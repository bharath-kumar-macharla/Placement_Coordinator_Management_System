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

const companySchema = z.object({
  name:        z.string().min(1).max(200),
  website:     z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  industry:    z.string().optional(),
});

/** GET /api/companies */
router.get("/", asyncHandler(async (req, res) => {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("*")
    .order("name");
  if (error) throw new ApiError(500, error.message);
  res.json({ companies: companies ?? [] });
}));

/** POST /api/companies — coordinator/admin */
router.post(
  "/",
  requireRole("coordinator", "admin"),
  validate(companySchema),
  asyncHandler(async (req, res) => {
    const { data: company, error } = await supabase
      .from("companies")
      .insert(req.body)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    await auditLog(req.user.id, "COMPANY_CREATED", "companies", company.id, null, req.body);
    res.status(201).json({ company });
  })
);

/** GET /api/companies/:id */
router.get("/:id", asyncHandler(async (req, res) => {
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (!company) throw new ApiError(404, "Company not found");
  res.json({ company });
}));

/** PUT /api/companies/:id — coordinator/admin */
router.put(
  "/:id",
  requireRole("coordinator", "admin"),
  validate(companySchema.partial()),
  asyncHandler(async (req, res) => {
    const { data: before } = await supabase
      .from("companies").select("*").eq("id", req.params.id).maybeSingle();
    if (!before) throw new ApiError(404, "Company not found");

    const { data: company, error } = await supabase
      .from("companies")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    await auditLog(req.user.id, "COMPANY_UPDATED", "companies", req.params.id, before, req.body);
    res.json({ company });
  })
);

/** DELETE /api/companies/:id — admin only */
router.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { data: before } = await supabase
      .from("companies").select("*").eq("id", req.params.id).maybeSingle();
    if (!before) throw new ApiError(404, "Company not found");

    const { error } = await supabase.from("companies").delete().eq("id", req.params.id);
    if (error) throw new ApiError(500, error.message);
    await auditLog(req.user.id, "COMPANY_DELETED", "companies", req.params.id, before, null);
    res.status(204).send();
  })
);

export default router;
