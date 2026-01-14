import { InsightItem } from "@/types/insights"

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\$/, "") || "http//localhost:5001"

// Generic helper function to fetch JSON from te backend
// T is a genereic type, so this function works with ANY response shape
async function fetchJSON<T>(path: string): Promise<T>{
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
    if (!res.ok) throw new Error(`API error ${res.status}`)
        return res.json()
}


type InsightsData = {
    name: string
    total_enquiries: number
    escalated_enquiries: number
}

// Get the most frequently asked enquiry categories
export async function getTopFrequentlyAsked(): Promise<InsightItem[]>{
    const rows = await fetchJSON<InsightsData[]>("/staff/insights/top-frequently-asked")

    return rows.map((r) => ({
        name: r.name,
        enquiries: r.total_enquiries,
        escalationRate: r.total_enquiries > 0 ? r.escalated_enquiries / r.total_enquiries : 0,
    }))
}

// Fetch the most escalated enquiries
export async function getTopMostEscalated(): Promise<InsightItem[]>{
    const rows = await fetchJSON<InsightsData[]>("/staff/insights/top-most-escalated")

    return rows.map((r) => ({
        name: r.name,
        enquiries: r.total_enquiries,
        escalationRate: r.total_enquiries > 0 ? r.escalated_enquiries / r.total_enquiries : 0,
    }))
}