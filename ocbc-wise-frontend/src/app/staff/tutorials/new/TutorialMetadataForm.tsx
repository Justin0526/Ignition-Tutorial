"use client"

import { useMemo, useState, useEffect, type FormEvent } from "react"
import TutorialBuilderSteps from "@/components/TutorialBuilderSteps"
import { useRouter } from "next/navigation"

export type CategoryNode = {
  enquiry_category_id: string
  name: string
  parent_id: string | null
}

type Props = {
  categories: CategoryNode[]
  mode?: "create" | "edit"
  lockCategory?: boolean
  submitting?: boolean
  initialValues?: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
    enquiry_category_name?: string | null
  }
  onSubmit: (payload: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
  }) => Promise<void> | void
  onStepClick?: (step: 1 | 2 | 3) => void
}

export default function TutorialMetadataForm({
    categories,
    onSubmit,
    mode = "create",
    initialValues,
    lockCategory,
    onStepClick,
  }: Props) {

  const router = useRouter()
  const [dupOpen, setDupOpen] = useState(false)
  const [dupMsg, setDupMsg] = useState("")
  const [dupTutorialId, setDupTutorialId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showDupModal, setShowDupModal] = useState(false)

  const isEdit = mode === "edit"
  const shouldLockCategory = lockCategory ?? isEdit

  const [name, setName] = useState(() => initialValues?.name ?? "")
  const [categoryId, setCategoryId] = useState("")

  const [subCategoryId, setSubCategoryId] = useState("")

  const [estimatedMins, setEstimatedMins] = useState<string>(() => {
    const sec = initialValues?.estimated_time_sec
    return sec == null ? "" : String(Math.round(sec / 60))
  })

  // If leaf category has no parent, store it in categoryId
  const selectedLeafId = subCategoryId || categoryId

  const topCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories]
  )

  const subCategories = useMemo(() => {
    if (!categoryId) return []
    return categories.filter((c) => c.parent_id === categoryId)
  }, [categories, categoryId])


  function getErrorBody(e: unknown): unknown {
    if (typeof e !== "object" || e === null) return undefined
    if (!("body" in e)) return undefined
    return (e as { body?: unknown }).body
  }

  function getTutorialExistsPayload(body: unknown): { tutorial_id: string } | null {
      if (typeof body !== "object" || body === null) return null
      const b = body as { code?: unknown; tutorial_id?: unknown }
      if (b.code === "TUTORIAL_EXISTS" && typeof b.tutorial_id === "string") {
        return { tutorial_id: b.tutorial_id }
      }
      return null
    }

    function findParentId(categories: CategoryNode[], id: string) {
    return categories.find((c) => c.enquiry_category_id === id)?.parent_id ?? null
  }

  useEffect(() => {
    if (!initialValues) return

    setName(initialValues.name ?? "")
    setEstimatedMins(
      initialValues.estimated_time_sec != null ? String(Math.round(initialValues.estimated_time_sec / 60)) : ""
    )

    const leaf = initialValues.enquiry_category_id
    const parent = findParentId(categories, leaf)

    if (parent) {
      setCategoryId(parent)
      setSubCategoryId(leaf)
    } else {
      setCategoryId(leaf)
      setSubCategoryId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.enquiry_category_id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedLeafId) return

    const mins = estimatedMins.trim() === "" ? undefined : Number(estimatedMins)
    const estimated_time_sec =
      mins === undefined || Number.isNaN(mins) ? undefined : Math.round(mins * 60)

    const payload: {
      name: string
      enquiry_category_id: string
      estimated_time_sec?: number
    } = {
      name: name.trim(),
      enquiry_category_id: selectedLeafId,
    }

    if (estimated_time_sec !== undefined) {
      payload.estimated_time_sec = estimated_time_sec
    }

    setFormError(null)
    try {
      await onSubmit(payload)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create tutorial."
      setDupMsg(msg)

      const body = getErrorBody(e)
      const exists = getTutorialExistsPayload(body)

      if (exists) {
        setDupTutorialId(exists.tutorial_id)
      } else {
        setDupTutorialId(null)
      }

      setDupOpen(true)
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        {/* ONE CONNECTED CARD */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* Step Indicator */}
          <TutorialBuilderSteps current={1} onStepClick={onStepClick} />
          <div className="h-px bg-slate-200" />

          {/* Body (centered content) */}
          <div className="p-10 flex justify-center">
            <div className="w-full max-w-3xl">
              <h1 className="text-3xl font-bold text-slate-900">
                Tutorial Metadata
              </h1>
              <div className="h-px bg-slate-200 mt-6 mb-8" />

              <form id="tutorial-metadata-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-slate-500">
                    TUTORIAL TITLE
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Update Account Address"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>

                {/* Category + Subcategory */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Category */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold tracking-widest text-slate-500">
                        CATEGORY
                      </label>
                    </div>

                    <select
                      value={categoryId}
                      disabled={shouldLockCategory}
                      onChange={(e) => {
                        setCategoryId(e.target.value)
                        setSubCategoryId("")
                      }}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                    >
                      <option value="">Choose Category</option>
                      {topCategories.map((c) => (
                        <option
                          key={c.enquiry_category_id}
                          value={c.enquiry_category_id}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold tracking-widest text-slate-500">
                        SUBCATEGORY
                      </label>
                    </div>

                    <select
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      disabled={shouldLockCategory || !categoryId || subCategories.length === 0}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50"
                    >
                      <option value="">
                        {categoryId
                          ? "Choose Subcategory"
                          : "Select Category first"}
                      </option>
                      {subCategories.map((c) => (
                        <option
                          key={c.enquiry_category_id}
                          value={c.enquiry_category_id}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estimated time */}
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-slate-500">
                    ESTIMATED TIME TO COMPLETE (mins)
                  </label>
                  <input
                    value={estimatedMins}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v !== "" && !/^\d+$/.test(v)) return
                      setEstimatedMins(v)
                    }}
                    placeholder="e.g., 3"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* FULL-WIDTH DIVIDER */}
          <div className="h-px bg-slate-200" />

          {/* Bottom action bar (full width) */}
          <div className="px-10 py-6 flex items-center justify-end gap-4">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setName("")
                setCategoryId("")
                setSubCategoryId("")
                setEstimatedMins("")
                setFormError(null)
              }}
            >
              Discard
            </button>

            <button
              type="submit"
              form="tutorial-metadata-form"
              disabled={name.trim().length === 0 || !selectedLeafId}
              className="rounded-xl bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {isEdit ? "Save" : "Continue"}
            </button>
          </div>
        </div>
      </div>

      {dupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDupOpen(false)}
          />
          <div
            className="relative w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-extrabold tracking-widest text-slate-400">
              DUPLICATE
            </div>

            <div className="mt-2 text-base font-semibold text-slate-900">
              Tutorial already exists
            </div>

            <div className="mt-2 text-sm text-slate-600">
              A tutorial for this category already exists. You can edit the existing tutorial, or choose another category.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setDupOpen(false)}
              >
                Choose another category
              </button>

              <button
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                disabled={!dupTutorialId}
                onClick={() => {
                  if (!dupTutorialId) return
                  router.push(`/staff/tutorials/${dupTutorialId}/metadata?mode=edit`)
                }}
              >
                Edit existing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
