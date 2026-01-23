"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((t) => {
        const hasPublished = !!t.published_tutorial_version_id
        const hasDraft = !!t.draft_tutorial_version_id

        const badge =
          hasPublished ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              LIVE
            </span>
          ) : hasDraft ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
              DRAFT
            </span>
          ) : null

        return (
          <div
            key={t.tutorial_id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {/* Badge (top-right) */}
            <div className="absolute right-4 top-4">{badge}</div>

            <div className="p-5">
              {/* Title */}
              <h3 className="pr-16 text-lg font-semibold text-slate-900 truncate" title={t.tutorial_name}>
                {t.tutorial_name}
              </h3>

              {/* Meta */}
              <p className="mt-1 text-sm text-slate-600">
                {t.enquiry_category_name}
                <span className="mx-2 text-slate-300">·</span>
                {Math.max(1, Math.round((t.estimated_time_sec ?? 0) / 60))} min
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Last updated: {new Date(t.latest_version_created_at).toLocaleString()} · v{t.latest_version_number}
              </p>

              {/* Version sections */}
              <div className="mt-5 space-y-3">
                {hasPublished && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Published</p>
                      <p className="text-xs text-slate-500">
                        v{t.published_version_created_at
                            ? new Date(t.published_version_created_at).toLocaleDateString()
                            : "—"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/staff/tutorials/${t.tutorial_id}/preview?version=${t.published_tutorial_version_id}&mode=view`
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Preview published
                    </button>
                  </div>
                )}

                {hasDraft && (
                  <div className="rounded-xl border border-slate-200 bg-amber-50/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Draft</p>
                      <p className="text-xs text-slate-500">
                        v{t.draft_version_created_at
                            ? new Date(t.draft_version_created_at).toLocaleDateString()
                            : "—"}
                      </p>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/staff/tutorials/${t.tutorial_id}/preview?version=${t.draft_tutorial_version_id}&mode=edit`
                          )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Preview draft
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(t.tutorial_id)}
                        className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
                      >
                        Continue draft
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom action */}
              {!hasDraft && (
                <button
                  type="button"
                  onClick={() => onEdit(t.tutorial_id)}
                  className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {hasPublished ? "Edit (creates draft)" : "Edit workflow"}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

}
