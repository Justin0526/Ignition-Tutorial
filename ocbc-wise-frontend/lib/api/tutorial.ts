const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5001"

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T>{
    const res = await fetch(`${BASE}${path}`, {
        cache: "no-store",
        ...options,
    })

    if (!res.ok){
        throw new Error(`API error ${res.status}`)
    }

    return res.json()
}

// Create tutorial + draft v1
export type Tutorial = {
    tutorial_id: string
    name: string
    enquiry_category_id: string
    estimated_time_sec: number | null
    created_at: string
}

export type TutorialVersion = {
    tutorial_version_id: string
    tutorial_id: string
    version_number: number
    status: "draft" | "published"
    created_at: string
}

export async function createTutorialDraft(input: { name: string, enquiry_category_id: string, estimated_time_sec?: number}):
    Promise<{ tutorial: Tutorial; draft_version: TutorialVersion }> {
        return fetchJSON("/staff/tutorials/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        })
}

export type TutorialStepText = {
    tutorial_step_text_id: string
    tutorial_step_id: string
    language_code: string
    instruction: string
    tip: string | null
    status: "draft" | "approved"
    created_at: string
}

export type TutorialStep = {
    tutorial_step_id: string
    tutorial_version_id: string
    step_index: number
    screen_asset_id: string

    scroll_progress: number
    target_x: number
    target_y: number
    target_w: number
    target_h: number

    created_at: string
    text: TutorialStepText | null
}

export async function getSteps( tutorial_version_id: string, lang: string = "en-SG"): 
    Promise<{ steps: TutorialStep[]; language_code: string }> {
        return fetchJSON(`/staff/tutorial-steps/tutorial-versions/${tutorial_version_id}/steps?lang=${lang}`)
}

export type CreateStepInput = {
    step_index: number
    screen_asset_id: string
    scroll_progress: number
    target_x: number
    target_y: number
    target_w: number
    target_h: number
    instruction: string
    tip?: string | null
    language_code?: string
    status?: "draft" | "approved"
}

export async function createStep(
    tutorial_version_id: string,
    input: CreateStepInput
): Promise<{ step: TutorialStep; text: TutorialStepText }> {
    return fetchJSON(
        `/staff/tutorial-steps/tutorial-versions/${tutorial_version_id}/steps`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        }
    )
}

export type EnquiryCategory = {
    enquiry_category_id: string
    name: string
    parent_id: string | null
}

export async function getEnquiryCategories(): Promise<EnquiryCategory[]> {
    return fetchJSON<EnquiryCategory[]>("/staff/insights/all-categories")
}




