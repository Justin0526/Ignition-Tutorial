"use client"

import { useMemo, useState } from "react"
import TutorialBuilderSteps from "@/components/TutorialBuilderSteps"

export type CategoryNode = {
  enquiry_category_id: string
  name: string
  parent_id: string | null
}

type Props = {
  // Pass in your categories from server/page (already fetched)
  categories: CategoryNode[]
  onSubmit?: (payload: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
  }) => Promise<void> | void
}

export default function TutorialMetadataForm({ categories, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subCategoryId, setSubCategoryId] = useState("")
  const [estimatedMins, setEstimatedMins] = useState<string>("")

  const topCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories]
  )

  const subCategories = useMemo(() => {
    if (!categoryId) return []
    return categories.filter((c) => c.parent_id === categoryId)
  }, [categories, categoryId])

  const selectedLeafId = subCategoryId || categoryId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeafId) return

    const mins = estimatedMins.trim() === "" ? undefined : Number(estimatedMins)
    const estimated_time_sec =
      mins === undefined || Number.isNaN(mins) ? undefined : Math.round(mins * 60)

    const payload = {
      name: name.trim(),
      enquiry_category_id: selectedLeafId,
      estimated_time_sec,
    }

    await onSubmit?.(payload)
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        {/* ONE CONNECTED CARD */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* Step Indicator */}
          <TutorialBuilderSteps current={1} />
          <div className="h-px bg-slate-200" />

          {/* Body (centered content) */}
          <div className="p-10 flex justify-center">
            <div className="w-full max-w-3xl">
              <h1 className="text-3xl font-bold text-slate-900">
                Tutorial Metadata
              </h1>
              <div className="h-px bg-slate-200 mt-6 mb-8" />

              <form onSubmit={handleSubmit} className="space-y-8">
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
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        CREATE NEW +
                      </button>
                    </div>

                    <select
                      value={categoryId}
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
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        CREATE NEW +
                      </button>
                    </div>

                    <select
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      disabled={!categoryId || subCategories.length === 0}
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
              }}
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={name.trim().length === 0 || !selectedLeafId}
              className="rounded-xl bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )


}
