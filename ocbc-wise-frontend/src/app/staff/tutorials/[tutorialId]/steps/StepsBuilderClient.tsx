"use client"

import { useMemo, useState } from "react"
import TutorialBuilderSteps from "@/components/TutorialBuilderSteps"
import ScreenPickerModal from "@/components/ScreenPickerModal"
import type { ScreenAsset } from "@/lib/api/screenAssets"

type Step = {
  id: string
  title: string
}

type ActionType = "direct_tap" | "scroll_then_tap"

export default function StepsBuilderClient() {
  const [steps, setSteps] = useState<Step[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(0)

  // Step form state (frontend only)
  const [instruction, setInstruction] = useState("")
  const [actionType, setActionType] = useState<ActionType>("direct_tap")
  const [tip, setTip] = useState("")
  const [scrollProgress, setScrollProgress] = useState<number>(0) // 0..1
  const [screenPickerOpen, setScreenPickerOpen] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<ScreenAsset | null>(null)


  const hasSteps = steps.length > 0
  const activeStep = useMemo(() => steps[activeIndex], [steps, activeIndex])

  function handleAddStep() {
    const nextIndex = steps.length + 1
    const newStep: Step = {
      id: crypto.randomUUID(),
      title: "(Untitled Step)",
    }
    setSteps((prev) => [...prev, newStep])
    setActiveIndex(nextIndex - 1)

    // reset per-step fields for now (MVP)
    setInstruction("")
    setActionType("direct_tap")
    setTip("")
    setScrollProgress(0)
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <TutorialBuilderSteps current={2} />
          <div className="h-px bg-slate-200" />

          {/* Main 3-column builder */}
          <div className="grid grid-cols-12">
            {/* 1) Journey Steps (Left) */}
            <aside className="col-span-12 md:col-span-3 border-r border-slate-200 p-6">
              <div className="text-xs font-extrabold tracking-widest text-slate-900">
                JOURNEY STEPS
              </div>

              <div className="mt-5 space-y-3">
                {steps.map((s, idx) => {
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={[
                        "w-full rounded-2xl px-4 py-4 text-left transition",
                        isActive
                          ? "bg-red-500 text-white"
                          : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "text-[10px] font-extrabold tracking-widest",
                          isActive ? "text-white/90" : "text-slate-500",
                        ].join(" ")}
                      >
                        STEP {idx + 1}
                      </div>
                      <div className="mt-1 text-sm font-semibold">{s.title}</div>
                    </button>
                  )
                })}

                <button
                  type="button"
                  className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-4 text-xs font-semibold tracking-widest text-slate-500 hover:bg-slate-50"
                  onClick={handleAddStep}
                >
                  + ADD STEP
                </button>
              </div>
            </aside>

            {/* 2) Instruction + action (Middle) */}
            <section className="col-span-12 md:col-span-6 border-r border-slate-200 p-6">
              {!hasSteps ? (
                <div className="rounded-2xl border border-slate-200 bg-white h-[420px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <div className="text-5xl">✏️</div>
                    <div className="mt-6 text-xs font-extrabold tracking-[0.25em] text-slate-300">
                      ADD A JOURNEY STEP TO BEGIN BUILDING.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* LOGIC & INTERACTION */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-red-500 text-white text-sm font-extrabold flex items-center justify-center">
                        1
                      </div>
                      <div className="text-sm font-extrabold tracking-widest text-slate-900">
                        LOGIC &amp; INTERACTION
                      </div>
                    </div>

                    {/* Step instruction */}
                    <div className="mt-6">
                      <label className="block text-xs font-semibold tracking-widest text-slate-500">
                        STEP INSTRUCTION
                      </label>
                      <input
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="Explain the action..."
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                      />
                    </div>

                    {/* Action type */}
                    <div className="mt-6">
                      <label className="block text-xs font-semibold tracking-widest text-slate-500">
                        ACTION TYPE
                      </label>

                      <div className="mt-3 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-12 lg:col-span-6">
                          <select
                            value={actionType}
                            onChange={(e) =>
                              setActionType(e.target.value as ActionType)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                          >
                            <option value="direct_tap">Direct Tap</option>
                            <option value="scroll_then_tap">Scroll then Tap</option>
                          </select>
                        </div>

                        {/* Scroll depth widget (only when scroll_then_tap) */}
                        <div className="col-span-12 lg:col-span-6">
                          {actionType === "scroll_then_tap" && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                              <div className="text-[10px] font-extrabold tracking-widest text-red-500">
                                SCROLL DEPTH ({Math.round(scrollProgress * 100)}%)
                              </div>

                              <div className="mt-2 flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-red-500" />
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={Math.round(scrollProgress * 100)}
                                  onChange={(e) =>
                                    setScrollProgress(
                                      Number(e.target.value) / 100
                                    )
                                  }
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HELP GUIDANCE */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-sm font-extrabold flex items-center justify-center">
                        2
                      </div>
                      <div className="text-sm font-extrabold tracking-widest text-slate-900">
                        HELP GUIDANCE
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold tracking-widest text-slate-600">
                          CONTEXTUAL ADVICE
                        </div>

                        <button
                          type="button"
                          className="text-xs font-extrabold tracking-widest text-red-500 hover:text-red-600"
                          onClick={() =>
                            alert("Suggest Help (hook later, maybe AI)")
                          }
                        >
                          ✨ Suggest Help
                        </button>
                      </div>

                      <textarea
                        value={tip}
                        onChange={(e) => setTip(e.target.value)}
                        placeholder="Detail how to help a struggling user..."
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 min-h-[120px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 3) Phone frame demo (Right) */}
            <section className="col-span-12 md:col-span-3 p-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold tracking-widest text-slate-500">
                  INTERACTION PLACEMENT
                </div>

                {selectedScreen && (
                  <button
                    type="button"
                    className="text-xs font-extrabold tracking-widest text-red-500 hover:text-red-600 hover:cursor-pointer"
                    onClick={() => setScreenPickerOpen(true)}
                  >
                    CHANGE SCREEN
                  </button>
                )}
              </div>

              {/* Phone frame (click to pick / change) */}
              <button
                type="button"
                className="mt-4 w-full flex items-center justify-center"
                onClick={() => setScreenPickerOpen(true)}
              >
                <div
                  className="
                    w-full
                    max-w-[14rem]
                    aspect-[9/19]
                    rounded-[2.75rem]
                    border-[0.5rem]
                    border-slate-900
                    bg-white
                    shadow-sm
                    overflow-hidden
                    flex
                    items-center
                    justify-center
                    hover:shadow-md
                    transition
                  "
                >
                  {selectedScreen ? (
                    <img
                      src={selectedScreen.public_url}
                      alt={selectedScreen.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center px-4">
                      <div className="text-2xl">📱</div>
                      <div className="mt-3 text-[10px] font-extrabold tracking-widest text-slate-900">
                        CLICK TO CHOOSE PAGE
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </section>

          </div>

          {/* Footer bar */}
          <div className="h-px bg-slate-200" />
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                🧾
              </div>
              <div>
                <div className="text-[10px] font-extrabold tracking-widest text-slate-400">
                  STEP COMMITMENT
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {hasSteps ? "Waiting for screen selection..." : "No steps yet."}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!hasSteps}
              className="rounded-2xl bg-slate-900 px-10 py-3 text-xs font-extrabold tracking-widest text-white disabled:opacity-40"
              onClick={() => alert("Save step (hook later)")}
            >
              SAVE STEP {hasSteps ? activeIndex + 1 : ""}
            </button>
          </div>
        </div>
      </div>
      <ScreenPickerModal
        open={screenPickerOpen}
        onClose={() => setScreenPickerOpen(false)}
        onSelect={(screen) => {
          setSelectedScreen(screen)
          setScreenPickerOpen(false)
        }}
      />

    </div>
  )
}
