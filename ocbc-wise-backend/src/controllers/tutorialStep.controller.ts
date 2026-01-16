import type { Request, Response } from "express";
import * as svc from "../services/tutorialStep.service.js";

function isUniqueViolation(err: any){
    return err?.code === "23505";
}

function isForeignKeyViolation(err: any){
    return err?.code === "23503";
}

export async function createStepHandler(req: Request, res: Response){
    try{
        const { tutorial_version_id } = req.params;
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
            status, // maps to text_status
        } = req.body;

        const result = await svc.createTutorialStepWithText({
            tutorial_version_id,
            step_index,
            screen_asset_id,
            scroll_progress,
            target_x,
            target_y,
            target_w,
            target_h,
            language_code,
            instruction,
            tip: tip ?? null,
            text_status: status ?? "draft",
        });

        return res.status(201).json(result);
    } catch(err: any){
        // duplicate step_index for a version OR duplicate language_code for a step
        if (isUniqueViolation(err)){
            return res.status(409).json({error: err.message});
        }

        // Invalid tutorial version id or screen asset id
        if (isForeignKeyViolation(err)){
            return res.status(400).json({error: "Invalid foreign key reference (version/screen asset not found)."});
        }

        return res.status(500).json({ error: err?.message ?? "Sever error"});
    }
}

export async function getStepsHandler(req: Request, res: Response){
    try{
        const { tutorial_version_id } = req.params;
        const language_code = (req.query.lang as string) || "en-SG";

        const steps = await svc.getStepsByTutorialVersion({tutorial_version_id, language_code})

        return res.status(200).json({ steps, language_code });
    } catch (err: any){
        return res.status(500).json({ error: err?.message ?? "Server error" });
    }
}