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
        const { versionId } = req.params
        if (!versionId) return res.status(400).json({ error: "versionId is required" })

        const steps = await svc.getTutorialStepsByVersion(versionId)
        return res.status(200).json({ steps })
    } catch (err: unknown) {
        if (err instanceof Error) {
        return res.status(500).json({ error: err.message })
        }
        return res.status(500).json({ error: "Server error" })
    }
}