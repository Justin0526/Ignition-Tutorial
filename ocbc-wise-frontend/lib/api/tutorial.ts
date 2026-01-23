const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5001"
import { fetchjson } from "./fetchJson"
class ApiError extends Error {
    status: number
    body: unknown

    constructor(message: string, status: number, body: unknown) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.body = body
    }
}

export async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        cache: "no-store",
        ...options,
    })

    const body: unknown = await res.json().catch(() => ({}))
    return body as T
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

export async function createTutorialDraft(input: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
    }): Promise<{ tutorial: Tutorial; draft_version: TutorialVersion }> {
    const payload = {
        ...input,
        estimated_time_sec: input.estimated_time_sec ?? null,
    }

    console.log("Create tutorial draft");

    return fetchjson(`${BASE}/staff/tutorials/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

export type TutorialLibraryRow = {
    tutorial_id: string;
    tutorial_name: string;
    estimated_time_sec: number | null;
    enquiry_category_id: string;
    enquiry_category_name: string;
    tutorial_created_at: string;

    published_tutorial_version_id: string | null
    published_version_number: number | null
    published_version_created_at: string | null

    draft_tutorial_version_id: string | null
    draft_version_number: number | null
    draft_version_created_at: string | null

    latest_tutorial_version_id: string;
    latest_version_number: number;
    latest_status: "draft" | "published" | "archived";
    latest_version_created_at: string;
};

export async function getTutorialLibrary(input?: {
    search?: string;
    status?: "draft" | "published";
    }): Promise<TutorialLibraryRow[]> {
    const params = new URLSearchParams();

    if (input?.search?.trim()) params.set("search", input.search.trim());
    if (input?.status) params.set("status", input.status);

    const qs = params.toString();
    const path = `/staff/tutorials/library${qs ? `?${qs}` : ""}`;

    return fetchJSON<TutorialLibraryRow[]>(path);
}

export async function resolveEditTutorial(tutorialId: string): Promise<{
    tutorial_id: string;
    tutorial_version_id: string;
    action?: "opened_existing_draft" | "created_new_draft_from_published";
    }> {
    const res = await fetch(`${BASE}/staff/tutorials/${tutorialId}/resolve-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `API error ${res.status}`);
    }

    return res.json();
}

export async function discardDraft(input: { tutorial_id: string; tutorial_version_id: string }) {
    const res = await fetch(`${BASE}/staff/tutorials/${input.tutorial_id}/discard-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ tutorial_version_id: input.tutorial_version_id }),
    })

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody.error || `API error ${res.status}`)
    }

    return res.json() as Promise<{ action: "deleted_tutorial_and_draft" | "deleted_draft_only" }>
}

export async function resolveEditableVersionServer(tutorialId: string) {
    const res = await fetch(`${BASE}/staff/tutorials/${tutorialId}/resolve-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorial_id: tutorialId }),
        cache: "no-store",
    })

    if (!res.ok) {
        let msg = `resolve-edit failed (${res.status})`
        try {
        const body = await res.json()
        if (body?.error) msg += `: ${body.error}`
        } catch {}
        throw new Error(msg)
    }

    return res.json() as Promise<{ tutorial_version_id: string; action?: string }>
}

export type TutorialMeta = {
    tutorial_id: string
    name: string
    estimated_time_sec: number | null
    enquiry_category_id: string
    enquiry_category_name: string 
}

export async function getTutorialMeta(tutorialId: string) {
    return fetchJSON<TutorialMeta>(`/staff/tutorials/${tutorialId}/metadata`)
}

export async function updateTutorialMeta(tutorialId: string, input: { name: string; estimated_time_sec: number | null }) {
    return fetchJSON<TutorialMeta>(`/staff/tutorials/${tutorialId}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })
}
