const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\$/, "") || "http//localhost:5001"

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

export type ScreenAsset = {
    screen_asset_id: string
    name: string
    type: "static" | "scrollable"
    bucket: string
    object_path: string
    content_width: number
    content_height: number
    created_at: string
    public_url: string
}

export async function getScreenAssets(): Promise<ScreenAsset[]>{
    return fetchJSON<ScreenAsset[]>("/staff/screen-assets/all")
}

type CreateScreenAssetInput = {
    name: string
    file: File
}

// Create a new screen asset (upload PNG)
export async function createScreenAsset(input: CreateScreenAssetInput):Promise<ScreenAsset>{
    const formData = new FormData()
    formData.append("name", input.name)
    formData.append("file", input.file)

    const res = await fetch(`${BASE}/staff/screen-assets`, {
        method: "POST",
        body: formData,
    })

    if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error || `API error ${res.status}`)
    }

    return res.json()
}

