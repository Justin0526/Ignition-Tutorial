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

export type TutorialStep = {
    target_x: number | null
    target_y: number | null
    target_w: number | null
    target_h: number | null
    is_nav_target: boolean | null
    nav_key: string
    instruction: string
    tip: string | null
}

export type UpsertStepInput = {
    screen_asset_id: string
    nav_key: string
    instruction: string
    tip?: string | null
    scroll_progress: number
    target_x: number | null
    target_y: number | null
    target_w: number | null
    target_h: number | null
    is_nav_target: boolean | null
}

export async function upsertTutorialStep(
    tutorial_version_id: string,
    step_index: number,
    input: UpsertStepInput
    ): Promise<TutorialStep> {
    return fetchJSON(
        `/staff/tutorial-versions/${tutorial_version_id}/steps/${step_index}`,
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        }
    )
}