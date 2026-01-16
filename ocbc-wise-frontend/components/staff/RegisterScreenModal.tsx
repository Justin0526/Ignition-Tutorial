"use client"

import { useRef, useState } from "react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { createScreenAsset } from "@/lib/api/screenAssets"

type Props = {
  open: boolean
  onClose: () => void
}

export default function RegisterScreenModal({ open, onClose }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [screenName, setScreenName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // "form" = register UI asset, "success" = saved screen
  const [mode, setMode] = useState<"form" | "success">("form")

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!open) return null

  function resetForm() {
    setScreenName("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleClose() {
    // when user manually closes modal, reset everything
    resetForm()
    setMode("form")
    onClose()
  }

  async function handleSave() {
    setError(null)

    if (!screenName.trim()) {
      setError("Screen name is required.")
      return
    }

    if (!selectedFile) {
      setError("Please upload a PNG or JPG image.")
      return
    }

    try {
      setLoading(true)
      await createScreenAsset({
        name: screenName.trim(),
        file: selectedFile,
      })

      // show success screen, keep modal open
      setMode("success")
      setLoading(false)
    } catch (err: unknown) {
      setLoading(false)
      if (err instanceof Error) setError(err.message)
      else setError("Failed to upload screen asset.")
    }
  }

  return (
    <div className="w-full">
      <div className="relative mt-6 w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 hover:cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-10">
          {mode === "success" ? (
            // =========================
            // SUCCESS VIEW
            // =========================
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-sm">
                <div className="h-12 w-12">
                  <DotLottieReact
                    src="https://lottie.host/368a4a68-987a-487c-843f-6c1de550b21b/DB9RVXBA3B.lottie"
                    loop
                    autoplay
                  />
                </div>
              </div>

              <h2 className="mt-6 text-2xl font-semibold text-slate-900">
                Saved to Registry
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Screen is now available for tutorial logic.
              </p>

              <button
                type="button"
                onClick={() => {
                  // back to form, keep modal open, allow adding more
                  resetForm()
                  setMode("form")
                }}
                className="mt-8 rounded-xl bg-slate-900 px-10 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 hover:cursor-pointer"
              >
                OK
              </button>
            </div>
          ) : (
            // =========================
            // FORM VIEW
            // =========================
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
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
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
                    ref={fileInputRef}
                    id="screen-upload"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setSelectedFile(file)
                      setPreviewUrl(URL.createObjectURL(file))
                      setError(null)
                    }}
                  />

                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:cursor-pointer"
                  >
                    <span className="text-lg">📁</span>
                    Upload PNG/JPG
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <p className="mt-6 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-10 flex items-center justify-end gap-4">
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-slate-600 hover:cursor-pointer"
                  >
                    CANCEL
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className={[
                      "rounded-xl px-8 py-3 text-sm font-semibold text-white shadow hover:cursor-pointer",
                      loading
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600",
                    ].join(" ")}
                  >
                    {loading ? "SAVING..." : "SAVE TO REGISTRY"}
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
          )}
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}
