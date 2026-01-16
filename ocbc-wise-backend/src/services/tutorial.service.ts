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