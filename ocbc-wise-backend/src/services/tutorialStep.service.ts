import { supabase } from "../lib/supabase.js"

export type CreateStepInput = {
    tutorial_version_id: string;
    step_index: number;
    screen_asset_id: string;
    scroll_progress: number;
    target_x: number;
    target_y: number;
    target_w: number;
    target_h: number;

    language_code?: string;
    instruction: string;
    tip?: string | null;
}

type TutorialStepRow = {
    tutorial_step_id: string;
    tutorial_version_id: string;
    step_index: number;
    screen_asset_id: string;
    scroll_progress: string | number;
    target_x: string | number;
    target_y: string | number;
    target_w: string | number;
    target_h: string | number;
    created_at: string;
};

type TutorialStepTextRow = {
    tutorial_step_text_id: string;
    tutorial_step_id: string;
    language_code: string;
    instruction: string
    tip: string | null;
    created_at: string;
}

async function insertTutorialStep(input: CreateStepInput) : Promise<TutorialStepRow>{
    const { data, error } = await supabase
        .from("tutorial_step")
        .insert([
            {
                tutorial_version_id: input.tutorial_version_id,
                step_index: input.step_index,
                screen_asset_id: input.screen_asset_id,
                scroll_progress: input.scroll_progress,
                target_x: input.target_x,
                target_y: input.target_y,
                target_w: input.target_w,
                target_h: input.target_h,
            },
        ])
        .select("tutorial_step_id, tutorial_version_id, step_index, screen_asset_id, scroll_progress, target_x, target_y, target_w, target_h, created_at")
        .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to insert tutorial_step (no data returned)");
    return data;
}

async function insertTutorialStepText(input: CreateStepInput & { tutorial_step_id: string}) : Promise<TutorialStepTextRow> {
    const language_code = input.language_code ?? "en-SG";

    const { data, error } = await supabase
        .from("tutorial_step_text")
        .insert([
            {
                tutorial_step_id: input.tutorial_step_id,
                language_code,
                instruction: input.instruction,
                tip: input.tip ?? null,
            },
        ])
        .select("tutorial_step_text_id, tutorial_step_id, language_code, instruction, tip, created_at")
        .single();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to insert tutorial_step_text (no data returned)");
    return data;

}

export async function createTutorialStepWithText(input: CreateStepInput){
    const step = await insertTutorialStep(input);

    try{
        const text = await insertTutorialStepText({...input, tutorial_step_id: step.tutorial_step_id});
        return { step, text };
    } catch (err){
        await supabase.from("tutorial_step").delete().eq("tutorial_step_id", step.tutorial_step_id);
        throw err;
    }
}

type StepWithTextRow = {
    tutorial_step_id: string;
    tutorial_version_id: string;
    step_index: number;
    screen_asset_id: string;

    scroll_progress: string | number;
    target_x: string | number;
    target_y: string | number;
    target_w: string | number;
    target_h: string | number;

    created_at: string;

    // joined text
    tutorial_step_text: Array<{
        tutorial_step_text_id: string;
        language_code: string;
        instruction: string;
        tip: string | null;
        created_at: string;
    }>;
};

export async function getStepsByTutorialVersion(params: {tutorial_version_id: string; language_code: string;}){
    const { data, error } = await supabase
        .from("tutorial_step")
        .select(
            `
            tutorial_step_id,
            tutorial_version_id,
            step_index,
            screen_asset_id,
            scroll_progress,
            target_x,
            target_y,
            target_w,
            target_h,
            created_at,
            tutorial_step_text (
                tutorial_step_text_id,
                language_code,
                instruction,
                tip,
                created_at
            )
            `
        )
        .eq("tutorial_version_id", params.tutorial_version_id)
        .order("step_index", { ascending: true})
        .eq("tutorial_step_text.language_code", params.language_code);

    if (error) throw error;
    if (!data) return [];

    // Flatten: each step should have 0 or 1 text rows for that language
    return data.map((s: StepWithTextRow) => {
        const text = s.tutorial_step_text?.[0] ?? null;

        return {
            tutorial_step_id: s.tutorial_step_id,
            tutorial_version_id: s.tutorial_version_id,
            step_index: s.step_index,
            screen_asset_id: s.screen_asset_id,

            // normalize numerics
            scroll_progress: Number(s.scroll_progress),
            target_x: Number(s.target_x),
            target_y: Number(s.target_y),
            target_w: Number(s.target_w),
            target_h: Number(s.target_h),

            created_at: s.created_at,

            text, // null if missing translation
        };
    });
}