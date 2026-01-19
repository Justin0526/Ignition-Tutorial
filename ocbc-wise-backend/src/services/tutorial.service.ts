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
