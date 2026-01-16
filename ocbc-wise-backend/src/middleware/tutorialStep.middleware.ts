import type { Request, Response, NextFunction } from "express";

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

function isNumber01(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
}

export function validateCreateStep(req: Request, res: Response, next: NextFunction) {
  const tutorial_version_id = req.params.tutorial_version_id;

  if (!isUuid(tutorial_version_id)) {
    return res.status(400).json({ error: "tutorial_version_id must be a UUID" });
  }

  const {
    step_index,
    screen_asset_id,
    scroll_progress,
    target_x,
    target_y,
    target_w,
    target_h,
    language_code,
    instruction,
    tip,
    status, // optional (maps to text_status)
  } = req.body ?? {};

  if (!Number.isInteger(step_index) || step_index < 0) {
    return res.status(400).json({ error: "step_index must be an integer >= 0" });
  }

  if (!isUuid(screen_asset_id)) {
    return res.status(400).json({ error: "screen_asset_id must be a UUID" });
  }

  if (!isNumber01(scroll_progress)) {
    return res.status(400).json({ error: "scroll_progress must be a number between 0 and 1" });
  }

  if (!isNumber01(target_x) || !isNumber01(target_y) || !isNumber01(target_w) || !isNumber01(target_h)) {
    return res.status(400).json({ error: "target_x/y/w/h must be numbers between 0 and 1" });
  }

  // If you want to enforce non-zero box size:
  if (target_w <= 0 || target_h <= 0) {
    return res.status(400).json({ error: "target_w and target_h must be > 0" });
  }

  if (typeof instruction !== "string" || instruction.trim().length === 0) {
    return res.status(400).json({ error: "instruction is required" });
  }

  if (instruction.trim().length > 500) {
    return res.status(400).json({ error: "instruction is too long (max 500 chars)" });
  }

  if (language_code !== undefined && (typeof language_code !== "string" || language_code.trim().length === 0)) {
    return res.status(400).json({ error: "language_code must be a non-empty string if provided" });
  }

  if (status !== undefined && status !== "draft" && status !== "approved") {
    return res.status(400).json({ error: "status must be 'draft' or 'approved' if provided" });
  }

  if (tip !== undefined && tip !== null && typeof tip !== "string") {
    return res.status(400).json({ error: "tip must be a string or null if provided" });
  }

  // Normalize
  req.body.instruction = instruction.trim();
  if (typeof language_code === "string") req.body.language_code = language_code.trim();

  // Attach param into body so controller/service can consume cleanly
  req.body.tutorial_version_id = tutorial_version_id;

  next();
}
