"use client"

import { useEffect, useState } from "react"
import { getTutorialLibrary, type TutorialLibraryRow } from "@/lib/api/tutorial"

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  return "Something went wrong"
}

export default function TutorialLibraryList(props: {
  onEdit: (tutorialId: string) => void
  search?: string
  status?: "draft" | "published" | "all"
}) {
  const { onEdit } = props

  const [rows, setRows] = useState<TutorialLibraryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getTutorialLibrary({
            search: props.search,
            status: props.status === "all" ? undefined : props.status,
        })

        if (!cancelled) setRows(data)
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  },[props.search, props.status])

  if (loading) return <p className="text-slate-500">Loading tutorials...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (rows.length === 0) return <p className="text-slate-500">No tutorials found.</p>

  return (
    <div className="space-y-3">
      {rows.map((t) => (
        <div
          key={t.tutorial_id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 truncate">{t.tutorial_name}</p>

              <span
                className={`text-xs rounded-full px-2 py-0.5 ${
                  t.latest_status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {t.latest_status}
              </span>

              <span className="text-xs text-slate-500">v{t.latest_version_number}</span>
            </div>

            <p className="text-sm text-slate-500 mt-1">
              Category: {t.enquiry_category_name} · Last updated:{" "}
              {new Date(t.latest_version_created_at).toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => onEdit(t.tutorial_id)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit workflow
          </button>
        </div>
      ))}
    </div>
  )
}
