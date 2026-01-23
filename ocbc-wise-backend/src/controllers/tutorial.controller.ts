import type { Request, Response } from "express";
import * as svc from "../services/tutorial.service.js"

function isPostgresUniqueViolation(err: any) : boolean{
    // Supabase/PostgREST typically uses psotgres error code as strings
    return err?.code === "23505";
}

function isForeignKeyViolation(err: any): boolean {
    return err?.code === "23503";
}

export async function createTutorialDraftHandler(req: Request, res: Response) {
    console.log("HIT createTutorialDraftHandler /staff/tutorials/new", req.body)
    try {
        const raw = Array.isArray(req.body) ? req.body[0] : req.body

        const name: unknown = raw?.name
        const enquiry_category_id: unknown = raw?.enquiry_category_id
        const estimated_raw: unknown = raw?.estimated_time_sec

        if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid name" })
        }
        if (typeof enquiry_category_id !== "string" || enquiry_category_id.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid enquiry_category_id" })
        }

        // normalize estimated_time_sec to number | null
        let estimated_time_sec: number | null = null
        if (estimated_raw !== undefined && estimated_raw !== null && estimated_raw !== "$undefined") {
        const n = Number(estimated_raw)
        if (!Number.isFinite(n)) {
            return res.status(400).json({ error: "estimated_time_sec must be a valid number" })
        }
        estimated_time_sec = n
        }

        const categoryId = enquiry_category_id.trim()

        const result = await svc.createTutorialDraft({
            name: name.trim(),
            enquiry_category_id: categoryId,
            estimated_time_sec,
        })

        return res.status(201).json(result)
    } catch (err: unknown) {
        console.error("createTutorialDraftHandler error:", err)
        if (
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            (err as Record<string, unknown>).code === "TUTORIAL_EXISTS"
        ) {
            const e = err as { message?: string; tutorial_id?: unknown }
            return res.status(409).json({
            error: e.message ?? "Tutorial already exists for this category.",
            code: "TUTORIAL_EXISTS",
            tutorial_id: typeof e.tutorial_id === "string" ? e.tutorial_id : null,
            })
        }

        // keep your other mappings if you want (unique violation, FK violation)
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Server error",
        })
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

export async function getTutorialLibraryHandler(req: Request, res: Response) {
    try {
        const search =
        typeof req.query.search === "string" ? req.query.search : undefined;

        const status =
        typeof req.query.status === "string" ? req.query.status : undefined;

        if (status && status !== "draft" && status !== "published") {
            return res.status(400).json({ error: "Invalid status. Use draft or published." });
        }

        const data = await svc.getTutorialLibrary({ search, status: status as any });

        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: err.message ?? "Server error" });
    }
}

export async function resolveEditHandler(req: Request, res: Response) {
    try {
        const tutorialId = req.params.tutorialId;

        const result = await svc.resolveEditableVersion({ tutorial_id: tutorialId });

        return res.status(200).json(result);
    }  catch (err: any) {
        return res.status(500).json({
            error: err?.message ?? "Server error",
            code: err?.code,
            details: err?.details,
        })
    }
}

export async function discardDraftHandler(req: Request, res: Response) {
    try {
        const tutorial_id = req.params.tutorialId
        const { tutorial_version_id } = req.body as { tutorial_version_id: string }

        if (!tutorial_version_id) return res.status(400).json({ error: "tutorial_version_id required" })

        const result = await svc.discardDraft({ tutorial_id, tutorial_version_id })
        return res.status(200).json(result)
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Server error"
        return res.status(500).json({ error: msg })
    }
}

export async function getTutorialMeta(req: Request, res: Response) {
  try {
    const tutorialId = req.params.tutorialId
    const data = await svc.getTutorialMeta({ tutorial_id: tutorialId })
    return res.status(200).json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error"
        // If you prefer: detect not found by message
    if (message.toLowerCase().includes("not found")) {
            return res.status(404).json({ error: message })
    }
    return res.status(500).json({ error: message })
  }
}

export async function updateTutorialMeta(req: Request, res: Response) {
    try {
        const tutorialId = req.params.tutorialId
        const { name, estimated_time_sec } = req.body as {
            name?: string
            estimated_time_sec?: number
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "name is required" })
        }

        let time: number | null = null
        if (estimated_time_sec !== undefined) {
            if (typeof estimated_time_sec !== "number" || !Number.isFinite(estimated_time_sec) || estimated_time_sec < 0) {
                return res.status(400).json({ error: "estimated_time_sec must be a non-negative number" })
            }
            time = estimated_time_sec
        }

        const data = await svc.updateTutorialMeta({
            tutorial_id: tutorialId,
            name: name.trim(),
            estimated_time_sec: time,
        })

        return res.status(200).json(data)
    }  catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Server error"
        // If you prefer: detect not found by message
        if (message.toLowerCase().includes("not found")) {
            return res.status(404).json({ error: message })
        }
        return res.status(500).json({ error: message })
    }
}

