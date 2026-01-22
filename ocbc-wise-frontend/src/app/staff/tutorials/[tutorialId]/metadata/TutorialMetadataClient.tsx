"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import TutorialMetadataForm, { type CategoryNode } from "../../new/TutorialMetadataForm"
import { updateTutorialMeta, type TutorialMeta } from "@/lib/api/tutorial"

export default function TutorialMetadataClient(props: {
  tutorialId: string
  tutorialVersionId: string
  mode: "create" | "edit"
  categories: CategoryNode[]
  initialMeta: TutorialMeta & { enquiry_category_name?: string | null }
}) {
  const router = useRouter()
  const { tutorialId, tutorialVersionId, categories, initialMeta } = props

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(payload: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
  }) {
    try {
      setSaving(true)
      setError(null)

      // Category is locked in edit; backend PATCH ignores category anyway (good)
      await updateTutorialMeta(tutorialId, {
        name: payload.name,
        estimated_time_sec: payload.estimated_time_sec ?? null,
      })

      // After metadata save, go to Steps (still using the same draft version id)
      router.push(`/staff/tutorials/${tutorialId}/steps?version=${tutorialVersionId}&mode=edit`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save metadata")
    } finally {
      setSaving(false)
    }
  }

  const handleTopNav = (step: 1 | 2 | 3) => {
    if (step === 1) return // already here
    if (step === 2) router.push(`/staff/tutorials/${tutorialId}/steps?version=${tutorialVersionId}&mode=edit`)
    if (step === 3) router.push(`/staff/tutorials/${tutorialId}/preview?version=${tutorialVersionId}&mode=edit`)
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="h-px bg-slate-200" />

          {error && (
            <div className="px-10 pt-6 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <TutorialMetadataForm
            categories={categories}
            mode="edit"
            lockCategory
            initialValues={{
                name: initialMeta.name,
                enquiry_category_id: initialMeta.enquiry_category_id,
                estimated_time_sec: initialMeta.estimated_time_sec ?? undefined,
                enquiry_category_name: initialMeta.enquiry_category_name ?? null,
            }}
            onSubmit={handleSubmit}
            submitting={saving}
            onStepClick={handleTopNav}
          />
        </div>
      </div>
    </div>
  )
}
