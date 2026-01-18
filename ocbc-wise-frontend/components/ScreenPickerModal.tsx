"use client"

import { useEffect, useState } from "react"
import type { ScreenAsset } from "@/lib/api/screenAssets"
import { getScreenAssets } from "@/lib/api/screenAssets"

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (asset: ScreenAsset) => void
}

export default function ScreenPickerModal({ open, onClose, onSelect }: Props) {
  const [assets, setAssets] = useState<ScreenAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function load() {
        try {
            setLoading(true)
            setError(null)
            const data = await getScreenAssets()
            if (!cancelled) setAssets(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
        } else {
            setError("Failed to load screens")
        }
        } finally {
            if (!cancelled) setLoading(false)
        }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open])

  // close on ESC
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl rounded-3xl bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 flex items-start justify-between">
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                Select Target Screen
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Choose the UI page where this step occurs.
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Body (scrollable) */}
          <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="text-sm font-semibold text-slate-600">
                Loading screens...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && assets.length === 0 && (
              <div className="text-sm text-slate-600">
                No screens found. Upload some screens first.
              </div>
            )}

            {!loading && !error && assets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {assets.map((a) => (
                  <button
                    key={a.screen_asset_id}
                    type="button"
                    onClick={() => {
                      onSelect(a)
                      onClose()
                    }}
                    className="text-left"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-sm transition">
                      <div className="aspect-[3/4] bg-slate-50">
                        <img
                          src={a.public_url}
                          alt={a.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="px-3 py-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {a.name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-200" />

          {/* Footer */}
          <div className="px-8 py-5 flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-10 py-3 text-xs font-extrabold tracking-widest text-white hover:bg-slate-800"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
