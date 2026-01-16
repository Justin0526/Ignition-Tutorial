// src/middleware/tutorial.middleware.ts
import type { Request, Response, NextFunction } from "express";

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  // simple UUID v4-ish check (good enough for API validation)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function validateCreateTutorialDraft(req: Request, res: Response, next: NextFunction) {
  const { name, enquiry_category_id, estimated_time_sec } = req.body ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "name is required" });
  }
  if (name.trim().length > 120) {
    return res.status(400).json({ error: "name is too long (max 120 chars)" });
  }

  if (!isUuid(enquiry_category_id)) {
    return res.status(400).json({ error: "enquiry_category_id must be a UUID" });
  }

  if (estimated_time_sec !== undefined && estimated_time_sec !== null) {
    if (typeof estimated_time_sec !== "number" || !Number.isFinite(estimated_time_sec)) {
      return res.status(400).json({ error: "estimated_time_sec must be a number" });
    }
    if (estimated_time_sec <= 0) {
      return res.status(400).json({ error: "estimated_time_sec must be > 0" });
    }
    if (estimated_time_sec > 60 * 60) {
      return res.status(400).json({ error: "estimated_time_sec too large (max 3600)" });
    }
  }

  // normalize
  req.body.name = name.trim();

  next();
}
