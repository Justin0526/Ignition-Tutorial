import { supabase } from "../lib/supabase.js"

export type CreateTutorialDraftInput = {
    name: string,
    enquiry_category_id: string
    estimated_time_sec: number
}

type TutorialRow = {
    tutorial_id: string;
    name: string;
    enquiry_category_id: string;
    estimated_time_sec: number;
    created_at: string; 
};

type InsertTutorialVersionInput = {
    tutorial_id: string;
    version_number: number;
    status: "draft" | "published" | "archived";
}

type TutorialVersionRow = {
    tutorial_version_id: string;
    tutorial_id: string;
    version_number: number;
    status: "draft" | "published" | "archived";
    created_at: string;
};

async function insertTutorial(input: CreateTutorialDraftInput): Promise<TutorialRow>{
    const { data, error } = await supabase
        .from("tutorial")
        .insert([
            {
                name: input.name,
                enquiry_category_id: input.enquiry_category_id,
                estimated_time_sec: input.estimated_time_sec,
            },
        ])
        .select("tutorial_id, name, enquiry_category_id, estimated_time_sec, created_at")
        .single();

    if (error) throw error;
    return data;
};

async function insertTutorialVersion(
    input: InsertTutorialVersionInput
    ): Promise<TutorialVersionRow> {
    const { data, error } = await supabase
        .from("tutorial_version")
        .insert([{
        tutorial_id: input.tutorial_id,
        version_number: input.version_number,
        status: input.status,
        }])
        .select("tutorial_version_id, tutorial_id, version_number, status, created_at")
        .single()

    if (error) {
        // ✅ Draft is unique per tutorial, handle race safely
        if (input.status === "draft") {
        const anyErr = error as any
        const msg = String(anyErr?.message ?? "")
        const details = String(anyErr?.details ?? "")
        const isUnique =
            anyErr?.code === "23505" ||
            msg.includes("duplicate key value") ||
            msg.includes("ux_tutorial_one_draft") ||
            details.includes("ux_tutorial_one_draft")

        if (isUnique) {
            const draftNow = await getLatestDraftVersion(input.tutorial_id)
            if (draftNow) {
            // Return shape must match TutorialVersionRow
            return {
                tutorial_version_id: draftNow.tutorial_version_id,
                tutorial_id: input.tutorial_id,
                version_number: draftNow.version_number,
                status: draftNow.status,
                created_at: draftNow.created_at,
            } as TutorialVersionRow
            }
        }
        }

        throw error
    }

    return data
}

export async function createTutorialDraft(input: CreateTutorialDraftInput){
    const tutorial = await insertTutorial(input);

    try{
        const draft_version = await insertTutorialVersion({
            tutorial_id: tutorial.tutorial_id,
            version_number: 1,
            status: "draft",
        })

        return { tutorial, draft_version};
    } catch (err){
        await supabase.from("tutorial").update({ deleted_at: new Date().toISOString() }).eq("tutorial_id", tutorial.tutorial_id);
        throw err;
    }
}

export type PublishTutorialInput = {
    tutorial_version_id: string
    tutorial_id: string
}

export async function publishTutorialVersion(input: PublishTutorialInput) {
    const { tutorial_version_id, tutorial_id } = input
    if (!tutorial_version_id) throw new Error("tutorial_version_id is required")
    if (!tutorial_id) throw new Error("tutorial_id is required")

    // Archive any currently published version (excluding the target)
    const { error: archiveErr } = await supabase
    .from("tutorial_version")
    .update({ status: "archived" })
    .eq("tutorial_id", tutorial_id)
    .eq("status", "published")
    .is("deleted_at", null)
    .neq("tutorial_version_id", tutorial_version_id)

    if (archiveErr) throw new Error(archiveErr.message)

    const { data, error } = await supabase
        .from("tutorial_version")
        .update({ status: "published" })
        .eq("tutorial_version_id", tutorial_version_id)
        .eq("tutorial_id", tutorial_id)
        .is("deleted_at", null)
        .select(
        `
        tutorial_version_id,
        tutorial_id,
        version_number,
        status,
        created_at
        `
        )
        .single()       

    if (error) throw new Error(error.message)
    if (!data) throw new Error("Tutorial version not found (or tutorial_id mismatch)")

    return data
}

export async function countStepsForVersion(tutorial_version_id: string) {
    const { count, error } = await supabase
        .from("tutorial_step")
        .select("tutorial_step_id", { count: "exact", head: true })
        .eq("tutorial_version_id", tutorial_version_id)

    if (error) throw new Error(error.message)
    return count ?? 0
}

type TutorialLibraryStatus = "draft" | "published" | "archived";

export async function getTutorialLibrary(params?: {search?: string; status?: TutorialLibraryStatus;}) {
    const search = params?.search?.trim();
    const status = params?.status;

    let q = supabase
        .from("tutorial_library_view")
        .select(
        "tutorial_id,tutorial_name,estimated_time_sec,enquiry_category_id,enquiry_category_name,tutorial_created_at,latest_tutorial_version_id,latest_version_number,latest_status,latest_version_created_at"
        )
        .order("latest_version_created_at", { ascending: false });

    // Optional search filter
    if (search) {
        q = q.ilike("tutorial_name", `%${search}%`);
    }

    // Optional status filter
    if (status) {
        // safety: only allow valid values
        if (status !== "draft" && status !== "published") {
        throw new Error("Invalid status filter");
        }
        q = q.eq("latest_status", status);
    }

    const { data, error } = await q;

    if (error) throw new Error(error.message);
    return data ?? [];
}

// Find latest draft version
async function getLatestDraftVersion(tutorial_id: string) {
    const { data, error } = await supabase
        .from("tutorial_version")
        .select("tutorial_version_id, tutorial_id, version_number, status, created_at")
        .eq("tutorial_id", tutorial_id)
        .eq("status", "draft")
        .is("deleted_at", null)
        .order("version_number", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw error
    return data // null if none
}

async function requireDraftVersion(tutorial_id: string) {
    const draft = await getLatestDraftVersion(tutorial_id)
    if (!draft) throw new Error("Draft not found")
    return draft
}


// Find published version
async function getPublishedVersion(tutorial_id: string) {
    const { data, error } = await supabase
        .from("tutorial_version")
        .select("tutorial_version_id, version_number, status, created_at")
        .eq("tutorial_id", tutorial_id)
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data; // null if none
}

// Compute next version number
async function getNextVersionNumber(tutorial_id: string) {
    const { data, error } = await supabase
        .from("tutorial_version")
        .select("version_number")
        .eq("tutorial_id", tutorial_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    const maxV = data?.version_number ?? 0;
    return maxV + 1;
}

// Copy all steps from one version to another
async function copySteps(from_version_id: string, to_version_id: string) {
    const { data: steps, error: readErr } = await supabase
        .from("tutorial_step")
        .select("step_index, screen_asset_id, scroll_progress, target_x, target_y, target_w, target_h, nav_key, instruction, tip, is_nav_target")
        .eq("tutorial_version_id", from_version_id)
        .order("step_index", { ascending: true });

    if (readErr) throw readErr;
    if (!steps || steps.length === 0) return;

    const payload = steps.map((s) => ({
        tutorial_version_id: to_version_id,
        step_index: s.step_index,
        screen_asset_id: s.screen_asset_id,
        scroll_progress: s.scroll_progress,
        target_x: s.target_x,
        target_y: s.target_y,
        target_w: s.target_w,
        target_h: s.target_h,
        nav_key: s.nav_key,
        instruction: s.instruction,
        tip: s.tip,
        is_nav_target: s.is_nav_target,
    }));

    const { error: insertErr } = await supabase.from("tutorial_step").insert(payload);
    if (insertErr) throw insertErr;
}

// resolve version that is editable
export async function resolveEditableVersion(input: { tutorial_id: string }) {
    const tutorial_id = input.tutorial_id

    // 1) If latest draft exists, open it
    const draft = await getLatestDraftVersion(tutorial_id)
    if (draft) {
        return {
        tutorial_id,
        tutorial_version_id: draft.tutorial_version_id,
        action: "opened_existing_draft",
        }
    }

    // 2) Otherwise, check published
    const published = await getPublishedVersion(tutorial_id)

    // 3) Create new draft version (v+1)
    const nextVersion = await getNextVersionNumber(tutorial_id)

    const { data: newDraft, error: insertErr } = await supabase
        .from("tutorial_version")
        .insert([{ tutorial_id, version_number: nextVersion, status: "draft" }])
        .select("tutorial_version_id, tutorial_id, version_number, status, created_at")
        .single()
    
    if (insertErr) {
        const anyErr = insertErr as any
        const msg = String(anyErr?.message ?? "")
        const details = String(anyErr?.details ?? "")

        const isUnique =
            anyErr?.code === "23505" ||
            msg.includes("duplicate key value") ||
            msg.includes("ux_tutorial_one_draft") ||
            details.includes("ux_tutorial_one_draft")

        if (isUnique) {
            const draftNow = await getLatestDraftVersion(tutorial_id)
            if (draftNow) {
            return {
                tutorial_id,
                tutorial_version_id: draftNow.tutorial_version_id,
                action: "opened_existing_draft",
            }
            }
            throw new Error("Draft already exists but could not be retrieved.")
        }

        throw insertErr
    }

    if (!newDraft) throw new Error("Failed to create draft version")

    // 4) If published exists, copy steps published -> new draft
    if (published) {
        await copySteps(published.tutorial_version_id, newDraft.tutorial_version_id)
        return {
        tutorial_id,
        tutorial_version_id: newDraft.tutorial_version_id,
        action: "created_new_draft_from_published",
        }
    }

    // 5) No published exists: empty draft is fine
    return {
        tutorial_id,
        tutorial_version_id: newDraft.tutorial_version_id,
        action: "created_new_draft_no_published",
    }
}

export async function discardDraft(input: {
    tutorial_id: string
    tutorial_version_id: string
    }) {
    const { tutorial_id, tutorial_version_id } = input

    // 1) Verify version exists and is a non-deleted draft
    const { data: draft, error: draftErr } = await supabase
        .from("tutorial_version")
        .select("tutorial_version_id, status")
        .eq("tutorial_id", tutorial_id)
        .eq("status", "draft")
        .is("deleted_at", null)
        .maybeSingle()

    if (draftErr) throw new Error(draftErr.message)
    if (!draft) throw new Error("No active draft to discard")

    // 2) Check if a published version exists
    const { data: published, error: pubErr } = await supabase
        .from("tutorial_version")
        .select("tutorial_version_id")
        .eq("tutorial_id", tutorial_id)
        .eq("status", "published")
        .is("deleted_at", null)
        .maybeSingle()

    if (pubErr) throw new Error(pubErr.message)

    // 3) Soft-delete the draft version
    const { error: delDraftErr } = await supabase
        .from("tutorial_version")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("tutorial_version_id", draft.tutorial_version_id)
        .eq("tutorial_id", tutorial_id)
        .is("deleted_at", null)

    if (delDraftErr) throw new Error(delDraftErr.message)

    // 4) If no published exists, soft-delete the tutorial too
    if (!published) {
        const { error: delTutErr } = await supabase
        .from("tutorial")
        .update({ deleted_at: new Date().toISOString() })
        .eq("tutorial_id", tutorial_id)
        .is("deleted_at", null)

        if (delTutErr) throw new Error(delTutErr.message)

        return { action: "deleted_tutorial_and_draft" as const }
    }

    return { action: "deleted_draft_only" as const }
}
