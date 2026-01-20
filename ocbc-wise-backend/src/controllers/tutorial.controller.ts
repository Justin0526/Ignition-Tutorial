import type { Request, Response } from "express";
import * as svc from "../services/tutorial.service.js"

function isPostgresUniqueViolation(err: any) : boolean{
    // Supabase/PostgREST typically uses psotgres error code as strings
    return err?.code === "23505";
}

function isForeignKeyViolation(err: any): boolean {
    return err?.code === "23503";
}

export async function createTutorialDraftHandler(req: Request, res: Response){
    try{
        const { name, enquiry_category_id, estimated_time_sec } = req.body;

        const result = await svc.createTutorialDraft({ name, enquiry_category_id, estimated_time_sec })

        return res.status(201).json(result);
    } catch (err: any){
        // duplicate tutorial name in same category
        if (isPostgresUniqueViolation(err)){
            return res.status(409).json({ error: "A tutorial with the same name already exists in this category."});
        }

        // Invalid category_id
        if (isForeignKeyViolation(err)){
            return res.status(400).json({ error: "Category not found"});
        }

        return res.status(500).json({ error: err?.message ?? "Server error" });
    }
}
export async function publishTutorial(req: Request, res: Response) {
    try {
        const { tutorial_version_id, tutorial_id } = req.body

        if (!tutorial_version_id) {
            return res.status(400).json({ error: "tutorial_version_id is required" })
        }
        if (!tutorial_id) {
            return res.status(400).json({ error: "tutorial_id is required" })
        }

        // block publish if no steps exist
        // If you don’t want this yet, remove this block.
        const stepCount = await svc.countStepsForVersion(tutorial_version_id)
        if (stepCount === 0) {
            return res.status(400).json({ error: "Cannot publish: version has no steps" })
        }

        const published = await svc.publishTutorialVersion({
            tutorial_version_id,
            tutorial_id,
        })

        return res.status(200).json({ ok: true, version: published })
    } catch (err: any) {
        return res.status(500).json({ error: err.message ?? "Server error" })
    }
}

export async function getAllPublishedTutorials(req: Request, res:Response){
    try{
        const data = await svc.getAllPublishedTutorials();
        return res.status(200).json(data);
    }catch(err: any){
        return res.status(500).json({ error : err.message ?? "Server error" })
    }
}
