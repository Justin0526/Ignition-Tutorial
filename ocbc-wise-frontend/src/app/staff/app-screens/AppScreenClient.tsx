"use client"

import { useState } from "react"
import { ScreenAsset } from "@/types/screenAsset"
import RegisterScreenModal from "@/components/RegisterScreenModal"
import { useRouter } from "next/navigation"
import { deleteScreenAsset } from "@/lib/api/screenAssets"

export default function AppScreensClient({
  screens,
}: {
  screens: ScreenAsset[]
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [deleting, setDeleting] = useState<ScreenAsset | null>(null)
  const [busy, setBusy] = useState(false)
  const [blockInfo, setBlockInfo] = useState<{ name: string; used_step_count: number } | null>(null)
  const [viewer, setViewer] = useState<ScreenAsset | null>(null)

  async function confirmDelete() {
    if (!deleting) return

    setBusy(true)

    try {
        await deleteScreenAsset(deleting.screen_asset_id)
        setDeleting(null)
        router.refresh()
      } catch (e: unknown) {
        if (
          typeof e === "object" &&
          e !== null &&
          "status" in e &&
          "body" in e
        ) {
          const err = e as {
            status?: number
            body?: {
              error?: string
              used_step_count?: number
            }
            message?: string
          }

          if (err.status === 409 && err.body?.error === "SCREEN_ASSET_IN_USE") {
            setBlockInfo({
              name: deleting.name,
              used_step_count: err.body.used_step_count ?? 0,
            })
            setDeleting(null)
            return
          }

          alert(err.message ?? "Delete failed")
        } else {
          alert("Delete failed")
        }
      } finally {
        setBusy(false)
      }
  }
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            App Screens
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the UI mockups available for tutorial creation.
          </p>
        </div>

        <button
            onClick={() => setOpen(true)}
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
            ➕ Add New Screen
        </button>
      </div>

      {/* UI card */}
      <RegisterScreenModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {router.refresh()}}
      />
      {open && <div className="h-6" />}

      {/* Confirm delete modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Delete screen?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-medium">{deleting.name}</span>?
              <br />
              This is a soft delete. If it’s used in any tutorial step, deletion will be blocked.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked modal */}
      {blockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Can’t delete this screen</h2>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{blockInfo.name}</span> is used in{" "}
              <span className="font-medium">{blockInfo.used_step_count}</span> tutorial step(s).
              <br />
              Replace it in those tutorials first, then try again.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockInfo(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/70 p-6" onClick={() => setViewer(null)}>
          <div className="mx-auto flex h-full max-w-6xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={() => setViewer(null)}
                className="absolute -top-12 right-0 rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white hover:bg-white/20"
              >
                ✕ Close
              </button>

              <img
                src={viewer.public_url}
                alt={viewer.name}
                className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />

              <p className="mt-3 text-center text-sm text-white/80">{viewer.name}</p>
            </div>
          </div>
        </div>
      )}


      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {screens.map((screen) => (
            <div
              key={screen.screen_asset_id}
              className="
                group relative overflow-hidden rounded-xl border bg-white shadow-sm
                transition transform
                hover:scale-[1.02]
                hover:shadow-md
              "
            >

            <div className="relative aspect-[9/16] bg-slate-100">
              <img
                src={screen.public_url}
                alt={screen.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              />

              {/* Center overlay button (view) */}
              <button
                type="button"
                onClick={() => setViewer(screen)}
                className="
                  absolute inset-0 flex items-center justify-center
                  bg-black/0 opacity-0 transition
                  group-hover:bg-black/25 group-hover:opacity-100
                "
                aria-label={`View ${screen.name}`}
                title="View full image"
              >
                <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow">
                  Click to view
                </span>
              </button>

              {/* Top-right delete icon (hover only) */}
              <button
                type="button"
                onClick={() => setDeleting(screen)} // assumes you already have deleting state + modal
                className="
                  absolute right-2 top-2
                  rounded-lg bg-white/90 p-2
                  text-slate-700 shadow
                  opacity-0 transition
                  group-hover:opacity-100
                  hover:bg-white
                "
                aria-label={`Delete ${screen.name}`}
                title="Delete"
              >
                🗑️
              </button>
            </div>

              <div className="p-4 flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900 truncate" title={screen.name}>
                  {screen.name}
                </p>
              </div>
            </div>
        ))}
      </div>
    </div>
  )
}
