"use client"
import TutorialLibraryList from "@/components/TutorialLibraryList"
import { resolveEditTutorial } from "@/lib/api/tutorial"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TutorialLibraryClient() {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<"all" | "draft" | "published">("all")
    const [debouncedSearch, setDebouncedSearch] = useState("")


    async function handleEdit(tutorialId: string) {
        const r = await resolveEditTutorial(tutorialId)
        router.push(`/staff/tutorials/${tutorialId}/steps?version=${r.tutorial_version_id}`)
    }

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(t)
    }, [search])

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Tutorial Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and monitor your self-service flows.
          </p>
        </div>

        <button
            onClick={() => {router.push("new")}}
            className="
                cursor-pointer
                rounded-lg
                bg-red-500
                px-4 py-2
                text-base font-medium
                text-white
                transition
                hover:bg-red-600
                hover:scale-105
            "
            >
            ➕ New Tutorial
        </button>
      </div>

        {/* Body */}
        <div className="flex items-center gap-3 mb-6">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tutorials..."
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "all" | "draft" | "published")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
            </select>
        </div>

        <TutorialLibraryList
            onEdit={handleEdit}
            search={debouncedSearch}
            status={status}
        />
    </div>
  )
}
