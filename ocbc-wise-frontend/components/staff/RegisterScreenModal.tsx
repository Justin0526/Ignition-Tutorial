"use client"

import { useState } from "react"

type Props = {
  open: boolean
  onClose: () => void
}

export default function RegisterScreenModal({ open, onClose }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  if (!open) return null

  return (
    <div className="w-full">
      <div className="relative mt-6 w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 hover:cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Left: Form */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Register UI Asset
              </h2>

              {/* Screen Name */}
              <div className="mt-8">
                <p className="text-xs font-bold tracking-widest text-slate-500">
                  SCREEN NAME
                </p>
                <input
                  type="text"
                  placeholder="e.g. Dashboard - Savings View"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>

              {/* Image Source */}
              <div className="mt-8">
                <p className="text-xs font-bold tracking-widest text-slate-500">
                  IMAGE SOURCE
                </p>

                <input
                  id="screen-upload"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const url = URL.createObjectURL(file)
                    setPreviewUrl(url)
                  }}
                />

                {/* Upload button  */}
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("screen-upload")?.click()
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:cursor-pointer"
                >
                  <span className="text-lg">📁</span>
                  Upload PNG/JPG
                </button>

                {/* URL input */}
                {/* <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-slate-400">🔗</span>
                  <input
                    type="text"
                    placeholder="Or paste an image URL here..."
                    className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div> */}
              </div>

              {/* Actions */}
              <div className="mt-10 flex items-center justify-end gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-slate-600 hover:cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-red-500 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-red-600 hover:cursor-pointer"
                >
                  SAVE TO REGISTRY
                </button>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl">🖼️</div>
                  <p className="mt-4 text-xs font-bold tracking-widest text-slate-400">
                    PREVIEW AREA
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Upload a PNG or JPG to preview it here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* rounded bottom padding like your screenshot */}
        <div className="h-6" />
      </div>
    </div>
  )
}
