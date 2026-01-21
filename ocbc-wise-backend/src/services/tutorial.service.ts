import { supabase } from "../lib/supabase.js"
import { getTutorialStepsByVersion } from "./tutorialStep.service.js"

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
    status: "draft" | "published";
}

type TutorialVersionRow = {
    tutorial_version_id: string;
    tutorial_id: string;
    version_number: number;
    status: "draft" | "published";
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

async function insertTutorialVersion(input: InsertTutorialVersionInput): Promise<TutorialVersionRow>{
    const { data, error } = await supabase
        .from("tutorial_version")
        .insert([
            {
                tutorial_id: input.tutorial_id,
                version_number: input.version_number,
                status: input.status,
            },
        ])
        .select("tutorial_version_id, tutorial_id, version_number, status, created_at")
        .single()

    if (error) throw error;
    return data;
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
        await supabase.from("tutorial").delete().eq("tutorial_id", tutorial.tutorial_id);
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

    // Unpublish any other published version for this tutorial
    const { error: unpublishErr } = await supabase
    .from("tutorial_version")
    .update({ status: "draft" })
    .eq("tutorial_id", tutorial_id)
    .eq("status", "published")
    .neq("tutorial_version_id", tutorial_version_id); // neq means unpublish all published versions for this tutorial except the one I'm publishing

    if (unpublishErr) throw new Error(unpublishErr.message);


    const { data, error } = await supabase
        .from("tutorial_version")
        .update({ status: "published" })
        .eq("tutorial_version_id", tutorial_version_id)
        .eq("tutorial_id", tutorial_id)
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

type TutorialLibraryStatus = "draft" | "published";

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
        .select("tutorial_version_id, version_number, status, created_at")
        .eq("tutorial_id", tutorial_id)
        .eq("status", "draft")
        .order("version_number", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data; // null if none
}

// Find published version
async function getPublishedVersion(tutorial_id: string) {
    const { data, error } = await supabase
        .from("tutorial_version")
        .select("tutorial_version_id, version_number, status, created_at")
        .eq("tutorial_id", tutorial_id)
        .eq("status", "published")
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
    const tutorial_id = input.tutorial_id;

    // 1) If latest draft exists, open it
    const draft = await getLatestDraftVersion(tutorial_id);
    if (draft) {
        return {
        tutorial_id,
        tutorial_version_id: draft.tutorial_version_id,
        action: "opened_existing_draft",
        };
    }

    // 2) Otherwise, base off published
    const published = await getPublishedVersion(tutorial_id);
    if (!published) {
        throw new Error("No published version found and no draft exists for this tutorial.");
    }

    // 3) Create new draft version (v+1)
    const nextVersion = await getNextVersionNumber(tutorial_id);

    const { data: newDraft, error: insertErr } = await supabase
        .from("tutorial_version")
        .insert([
        {
            tutorial_id,
            version_number: nextVersion,
            status: "draft",
        },
        ])
        .select("tutorial_version_id, tutorial_id, version_number, status, created_at")
        .single();

    if (insertErr) throw insertErr;

    // 4) Copy steps published -> new draft
    await copySteps(published.tutorial_version_id, newDraft.tutorial_version_id);

    return {
        tutorial_id,
        tutorial_version_id: newDraft.tutorial_version_id,
        action: "created_new_draft_from_published",
    };
}


