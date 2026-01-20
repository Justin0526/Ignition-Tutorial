import type { Request, Response, NextFunction } from "express"

export function validateUpsertTutorialStep(
    req: Request,
    res: Response,
    next: NextFunction
    ) {
    const { versionId, stepIndex } = req.params

    // ---- Params validation ----
    if (!versionId) {
        return res.status(400).json({ error: "versionId is required" })
    }

    const stepIdx = Number(stepIndex)
    if (!Number.isInteger(stepIdx) || stepIdx < 1) {
        return res
        .status(400)
        .json({ error: "stepIndex must be a positive integer" })
    }

    // ---- Body validation ----
    const {
        screen_asset_id,
        nav_key,
        instruction,
        scroll_progress,

        target_x,
        target_y,
        target_w,
        target_h,
        is_nav_target,
    } = req.body

    if (!screen_asset_id) {
        return res.status(400).json({ error: "screen_asset_id is required" })
    }

    if (!nav_key) {
        return res.status(400).json({ error: "nav_key is required" })
    }

    if (!instruction || String(instruction).trim().length === 0) {
        return res.status(400).json({ error: "instruction is required" })
    }

    if (
        typeof scroll_progress !== "number" ||
        scroll_progress < 0 ||
        scroll_progress > 1
    ) {
        return res
        .status(400)
        .json({ error: "scroll_progress must be between 0 and 1" })
    }

    // ---- Target invariant (no_tap logic) ----
    const targets = [target_x, target_y, target_w, target_h]
    const anyNull = targets.some((v) => v == null)
    const allNull = targets.every((v) => v == null)

    if (anyNull && !allNull) {
        return res.status(400).json({
        error: "target_x, target_y, target_w, target_h must be all null or all set",
        })
    }

    if (allNull && is_nav_target != null) {
        return res.status(400).json({
        error: "is_nav_target must be null when no target is provided",
        })
    }

    
    req.body.scroll_progress = Number(scroll_progress)
    req.params.stepIndex = String(stepIdx)

    next()
}
