import type { Request, Response } from "express";
import * as svc from "../services/tutorialStep.service.js"

export async function upsertTutorialStepHandler(req: Request, res: Response) {
    try {
        const tutorial_version_id = req.params.versionId
        const step_index = Number(req.params.stepIndex)

        const {
        screen_asset_id,
        nav_key,
        instruction,
        tip,
        scroll_progress,
        target_x,
        target_y,
        target_w,
        target_h,
        is_nav_target,
        } = req.body

        const result = await svc.upsertTutorialStep({
        tutorial_version_id,
        step_index,
        screen_asset_id,
        nav_key,
        instruction,
        tip: tip ?? null,
        scroll_progress,
        target_x,
        target_y,
        target_w,
        target_h,
        is_nav_target,
        })

        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(500).json({ error: err?.message ?? "Server error" })
    }
}

export async function getTutorialStepsByVersionHandler(req: Request, res: Response) {
    try {
        const tutorial_version_id = req.params.tutorialVersionId
        const rows = await svc.getTutorialStepsByVersion(tutorial_version_id)
        return res.json({ steps: rows })
    } catch (e: any) {
        return res.status(500).json({
        error: e?.message ?? "getSteps failed",
        where: "GET /staff/tutorial-steps/:tutorialVersionId/steps",
        })
    }
}

export async function syncTutorialStepsHandler(req: Request, res: Response) {
    try {
        const { tutorial_version_id, steps } = req.body as {
        tutorial_version_id: string
        steps: Array<{
            step_index: number
            screen_asset_id: string
            nav_key: string
            instruction: string
            tip: string | null
            scroll_progress: number
            target_x: number | null
            target_y: number | null
            target_w: number | null
            target_h: number | null
            is_nav_target: boolean | null
        }>
        }

        if (!tutorial_version_id) return res.status(400).json({ error: "tutorial_version_id required" })
        if (!Array.isArray(steps)) return res.status(400).json({ error: "steps must be an array" })

        const result = await svc.syncTutorialSteps({ tutorial_version_id, steps })
        return res.status(200).json(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Server error"
        return res.status(500).json({ error: message })
   }
}
