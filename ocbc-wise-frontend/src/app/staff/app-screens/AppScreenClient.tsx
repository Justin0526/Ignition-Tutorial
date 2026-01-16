"use client"

import { useState } from "react"
import { ScreenAsset } from "@/types/screenAsset"
import RegisterScreenModal from "@/components/staff/RegisterScreenModal"

export default function AppScreensClient({
  screens,
}: {
  screens: ScreenAsset[]
}) {
  const [open, setOpen] = useState(false)

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
      <RegisterScreenModal open={open} onClose={() => setOpen(false)} />

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {screens.map((screen) => (
            <div
            key={screen.screen_asset_id}
            className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
            <div className="aspect-[9/16] bg-slate-100">
                <img
                src={screen.public_url}
                alt={screen.name}
                className="h-full w-full object-cover"
                />
            </div>

            <div className="p-4">
                <p className="font-medium text-slate-900">
                {screen.name}
                </p>
            </div>
            </div>
        ))}
      </div>
    </div>
  )
}
