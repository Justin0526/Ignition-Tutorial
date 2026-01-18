"use client"

import TutorialBuilderSteps from "@/components/TutorialBuilderSteps" // adjust path if needed

export default function TutorialPreviewClient() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        {/* ONE CONNECTED CARD */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* Step Indicator */}
          <TutorialBuilderSteps current={3} />
          <div className="h-px bg-slate-200" />

          {/* Body (placeholder for now) */}
          <div className="p-10 flex justify-center">
            <div className="w-full max-w-4xl">
              <h1 className="text-3xl font-bold text-slate-900">
                Preview Tutorial
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Check the flow before saving as draft or publishing.
              </p>

              <div className="h-px bg-slate-200 mt-6 mb-8" />

              {/* Center phone frame */}
            <div className="w-full flex justify-center">
            <div className="w-full max-w-[340px]">
                {/* Outer device shell (black frame) */}
                <div className="rounded-[2.25rem] bg-slate-900 p-2 shadow-sm">
                {/* Inner screen */}
                <div className="rounded-[2rem] bg-white ring-1 ring-slate-200 overflow-hidden">
                    <div className="aspect-[9/18] w-full bg-slate-50 flex items-center justify-center">
                    <span className="text-slate-500 text-sm">
                        Phone preview (steps will render here)
                    </span>
                    </div>
                </div>
                </div>
            </div>
            </div>
            </div>
          </div>

          {/* FULL-WIDTH DIVIDER */}
          <div className="h-px bg-slate-200" />

          {/* Bottom action bar (full width) */}
          <div className="px-10 py-6 flex items-center justify-between gap-4">
            {/* Left: Discard build (text only) */}
            <button
              type="button"
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              onClick={() => {}}
            >
              DISCARD BUILD
            </button>

            {/* Right: actions */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {}}
              >
                Save as draft
              </button>

              <button
                type="button"
                className="rounded-xl bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                onClick={() => {}}
              >
                Publish tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
