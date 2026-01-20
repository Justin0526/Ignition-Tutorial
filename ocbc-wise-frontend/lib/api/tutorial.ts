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

export type EnquiryCategory = {
    enquiry_category_id: string
    name: string
    parent_id: string | null
}

export async function getEnquiryCategories(): Promise<EnquiryCategory[]> {
    return fetchJSON<EnquiryCategory[]>("/staff/insights/all-categories")
}

export async function publishTutorial(input: {tutorial_version_id:string, tutorial_id:string}){
    const res = await fetch(`${BASE}/staff/tutorials/publish`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tutorial_version_id: input.tutorial_version_id,
            tutorial_id: input.tutorial_id,
        }),
    })

    if (!res.ok){
        const errorBody = await res.json()
        throw new Error(errorBody.error || `API error ${res.status}`)
    }

    return res.json()
}


