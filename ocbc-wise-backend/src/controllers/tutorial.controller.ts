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