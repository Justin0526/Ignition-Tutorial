"use client"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import TutorialBuilderSteps from "@/components/TutorialBuilderSteps"
import ScreenPickerModal from "@/components/ScreenPickerModal"
import type { ScreenAsset } from "@/lib/api/screenAssets"
import type { NavBarAsset } from "@/lib/api/screenAssets"
import { getNavBarAssets } from "@/lib/api/screenAssets"
import { upsertTutorialStep } from "@/lib/api/tutorialSteps"
import { getTutorialSteps } from "@/lib/api/tutorialSteps"
import { syncTutorialSteps } from "@/lib/api/tutorialSteps"
import { discardDraft } from "@/lib/api/tutorial"
import { useRouter } from "next/navigation"

type StepTarget = {
  x: number // 0..1 (top-left of target box)
  y: number // 0..1
  w: number // 0..1
  h: number // 0..1
  isNav: boolean
}

type StepDraft = {
  instruction: string
  tip: string
  actionType: ActionType
  scrollProgress: number
  nav_key: string
  screen: ScreenAsset | null
}

type Step = {
  id: string
  title: string
  target?: StepTarget | null
  draft: StepDraft
  isSaved?: boolean
}

type ActionType = "direct_tap" | "scroll_then_tap" | "no_tap"

export default function StepsBuilderClient() {
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(0)

  // Step form state (frontend only)
  const [instruction, setInstruction] = useState("")
  const [actionType, setActionType] = useState<ActionType>("direct_tap")
  const [tip, setTip] = useState("")
  const [scrollProgress, setScrollProgress] = useState<number>(0) // 0..1
  const [screenPickerOpen, setScreenPickerOpen] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<ScreenAsset | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  // ✅ Navbar dropdown state
  const [navbars, setNavbars] = useState<NavBarAsset[]>([])
  const [selectedNavKey, setSelectedNavKey] = useState<string>("")
  // ✅ Find the chosen navbar object from the dropdown selection
  const selectedNavbar = navbars.find((n) => n.nav_key === selectedNavKey) ?? null

  const phoneFrameRef = useRef<HTMLDivElement | null>(null)
  const [phoneWidth, setPhoneWidth] = useState(0)

  const params = useParams<{ tutorialId: string }>()
  const searchParams = useSearchParams()

  const tutorialId = params.tutorialId
  const tutorialVersionId = searchParams.get("version") ?? ""

  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavStep, setPendingNavStep] = useState<1 | 2 | 3 | null>(null)

  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ✅ Tap circle default size (ratios, relative to full phone viewport)
  const TAP_W = 0.12
  const TAP_H = 0.06

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
  }

  // ✅ This ref points to the scroll container inside the phone preview.
  // We will scroll it programmatically (no manual scrolling).
  const contentScrollRef = useRef<HTMLDivElement | null>(null)

  const navbarHeight =
  selectedNavbar && phoneWidth > 0
    ? phoneWidth * (selectedNavbar.content_height / selectedNavbar.content_width)
    : 0

  const hasSteps = steps.length > 0
  const activeStep = steps[activeIndex] ?? null
  const activeTarget = activeStep?.target ?? null
  const allStepsSaved = steps.length > 0 && steps.every((s) => s.isSaved === true)
  const activeStepId = steps[activeIndex]?.id


  // ✅ Control preview scrolling ONLY via Action Type slider.
  // - direct_tap: lock preview at top (no scrolling)
  // - scroll_then_tap: scroll programmatically based on scrollProgress (0..1)
  useEffect(() => {
    const el = contentScrollRef.current
    if (!el) return

    // If it's a direct tap step, always show top of page
    if (actionType === "direct_tap") {
      el.scrollTop = 0
      return
    }

    // If it's scroll then tap, scroll according to slider
    const maxScroll = el.scrollHeight - el.clientHeight
    el.scrollTop = maxScroll * scrollProgress
  }, [actionType, scrollProgress, selectedScreen])

  // ✅ Fetch navbar assets once when page loads
  useEffect(() => {
    getNavBarAssets()
      .then((data) => {
        console.log("NAVBARS:", data)
        setNavbars(data)

      })
      .catch((err) => {
        console.error("Failed to load navbars:", err)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!phoneFrameRef.current) return

    const el = phoneFrameRef.current
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0
      setPhoneWidth(w)
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!hasSteps) return
    if (actionType !== "no_tap") return

    // Clear target for active step when switching to no_tap
    setSteps((prev) =>
      prev.map((s, idx) => (idx === activeIndex ? { ...s, target: undefined } : s))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType, activeIndex])

 useEffect(() => {
    if (!hasSteps) return
    const step = steps[activeIndex]
    if (!step) return
    loadStepToForm(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  useEffect(() => {
    if (!hasSteps) return
    const step = steps[activeIndex]
    if (!step) return
    loadStepToForm(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, activeStepId])

  async function refetchAndHydrateSteps() {
    if (!tutorialVersionId) return

    const { steps: rows } = await getTutorialSteps(tutorialVersionId)

    const hydrated: Step[] = rows.map((r) => {
      const hasTarget =
        r.target_x != null &&
        r.target_y != null &&
        r.target_w != null &&
        r.target_h != null

      const actionType: ActionType = !hasTarget
        ? "no_tap"
        : r.scroll_progress > 0
          ? "scroll_then_tap"
          : "direct_tap"

      const screen: ScreenAsset | null =
        r.screen_public_url && r.screen_name
          ? ({
              screen_asset_id: r.screen_asset_id,
              name: r.screen_name,
              public_url: r.screen_public_url,
            } as ScreenAsset)
          : null

      return {
        id: r.tutorial_step_id,
        title: r.instruction?.trim() ? r.instruction.trim() : "(Untitled Step)",
        isSaved: true,
        target: hasTarget
          ? {
              x: r.target_x!,
              y: r.target_y!,
              w: r.target_w!,
              h: r.target_h!,
              isNav: r.is_nav_target ?? false,
            }
          : null,
        draft: {
          instruction: r.instruction ?? "",
          tip: r.tip ?? "",
          actionType,
          scrollProgress: r.scroll_progress ?? 0,
          nav_key: r.nav_key ?? "",
          screen,
        },
      }
    })

    setSteps(hydrated)
    setActiveIndex(0)
    if (hydrated[0]) loadStepToForm(hydrated[0])
  }

  useEffect(() => {
    if (!tutorialVersionId) return

    ;(async () => {
      try {
        await refetchAndHydrateSteps()
      } catch (e) {
        // optional: console.error(e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialVersionId])

  function markActiveStepUnsaved() {
    if (!hasSteps) return
    setSteps((prev) =>
      prev.map((s, idx) => (idx === activeIndex ? { ...s, isSaved: false } : s))
    )
  }

  function handleAddStep() {
    const nextIndex = steps.length + 1
    const newStep: Step = {
      id: crypto.randomUUID(),
      title: "(Untitled Step)",
      target: null,
      draft: {
        instruction: "",
        tip: "",
        actionType: "direct_tap",
        scrollProgress: 0,
        nav_key: "",
        screen: null,
      },
    }

    setSteps((prev) => [...prev, newStep])
    setActiveIndex(nextIndex - 1)

    // reset per-step fields for now (MVP)
    setInstruction("")
    setActionType("direct_tap")
    setTip("")
    setScrollProgress(0)
  }

  function handlePlaceTapTarget(e: React.MouseEvent) {
    e.stopPropagation()

    if (!hasSteps) return
    if (!selectedScreen) return
    if (!phoneFrameRef.current) return

    const rect = phoneFrameRef.current.getBoundingClientRect()

    // Click position inside full phone viewport (includes navbar area)
    const xPx = clamp(e.clientX - rect.left, 0, rect.width)
    const yPx = clamp(e.clientY - rect.top, 0, rect.height)

    const xCenter = xPx / rect.width
    const yCenter = yPx / rect.height

    // Convert center → top-left box (tap circle)
    const w = TAP_W
    const h = TAP_H
    let x = xCenter - w / 2
    let y = yCenter - h / 2

    // Clamp box to viewport bounds
    x = clamp(x, 0, 1 - w)
    y = clamp(y, 0, 1 - h)

    // Auto-detect if click is within navbar region (bottom navbarHeight px)
    const navbarTopPx = rect.height - navbarHeight
    const isNav = yPx >= navbarTopPx

    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === activeIndex
          ? { ...s, target: { x, y, w, h, isNav } }
          : s
      )
    )
  }

  function persistActiveFormToStep() {
    if (!hasSteps) return

    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === activeIndex
          ? {
              ...s,
              title: instruction.trim() ? instruction.trim() : s.title,
              target: activeTarget ?? s.target ?? null,
              draft: {
                instruction,
                tip,
                actionType,
                scrollProgress,
                nav_key: selectedNavKey,
                screen: selectedScreen,
              },
            }
          : s
      )
    )
  }

  function loadStepToForm(step: Step) {
    setInstruction(step.draft.instruction ?? "")
    setTip(step.draft.tip ?? "")
    setActionType(step.draft.actionType ?? "direct_tap")
    setScrollProgress(step.draft.scrollProgress ?? 0)
    setSelectedNavKey(step.draft.nav_key ?? "")
    setSelectedScreen(step.draft.screen ?? null)
    setIsDirty(false)
  }

  async function handleSaveStep() {
    setSaveError(null)

    if (!hasSteps) {
      setSaveError("Add a step first.")
      return
    }
    if (!tutorialVersionId) {
      setSaveError("Missing tutorial version id in URL (?version=...).")
      return
    }
    if (!selectedScreen) {
      setSaveError("Select a screen (frame) first.")
      return
    }
    if (!selectedNavKey) {
      setSaveError("Select a navigation bar first.")
      return
    }
    if (!instruction.trim()) {
      setSaveError("Step instruction is required.")
      return
    }

    const isNoTap = actionType === "no_tap"

    if (actionType !== "no_tap" && !activeTarget) {
      setSaveError("Place a tap target on the phone preview first.")
      return
    }

    const target = isNoTap ? null : activeTarget

    persistActiveFormToStep()
    const payload = {
      screen_asset_id: selectedScreen.screen_asset_id,
      nav_key: selectedNavKey,
      instruction: instruction.trim(),
      tip: tip.trim() ? tip.trim() : null,
      scroll_progress: actionType === "scroll_then_tap" ? scrollProgress : 0,

      target_x: target ? target.x : null,
      target_y: target ? target.y : null,
      target_w: target ? target.w : null,
      target_h: target ? target.h : null,
      is_nav_target: target ? target.isNav : null,
    }

    try {
      setSaving(true)

      await upsertTutorialStep(
        tutorialVersionId,
        activeIndex + 1,
        payload
      )

      setShowSaved(true)
      window.setTimeout(() => setShowSaved(false), 2000)

      const title = instruction.trim() ? instruction.trim() : "(Untitled Step)"
        setSteps((prev) =>
          prev.map((s, idx) => (idx === activeIndex ? { ...s, title } : s))
      )

      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === activeIndex ? { ...s, isSaved: true } : s
        )
      )

      // Optional: small success feedback
      // You can replace this with a toast later
      // alert("Saved!")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSaveError(err.message)
      } else {
        setSaveError("Failed to save step.")
      }
    } finally {
          setSaving(false)
        }
  }

  function snapshotStepsWithActiveForm(): Step[] {
    return steps.map((s, idx) =>
      idx === activeIndex
        ? {
            ...s,
            title: instruction.trim() ? instruction.trim() : s.title,
            target: activeTarget ?? s.target ?? null,
            draft: {
              instruction,
              tip,
              actionType,
              scrollProgress,
              nav_key: selectedNavKey,
              screen: selectedScreen,
            },
          }
        : s
    )
  }

 async function handleDeleteStep(stepId: string) {
    if (saving) return
    const ok = window.confirm("Delete this step?")
    if (!ok) return

    const base = snapshotStepsWithActiveForm()
    const delIndex = base.findIndex((s) => s.id === stepId)
    if (delIndex === -1) return

    const nextSteps = base.filter((s) => s.id !== stepId)

    // update UI first
    setSteps(nextSteps.map((s) => ({ ...s, isSaved: false })))
    setActiveIndex((curr) => {
      if (nextSteps.length === 0) return 0
      if (delIndex < curr) return curr - 1
      if (delIndex === curr) return Math.min(curr, nextSteps.length - 1)
      return curr
    })

    // sync to DB so refresh won't bring it back
    if (!tutorialVersionId) return
    try {
      setSaving(true)

      for (let i = 0; i < nextSteps.length; i++) {
        if (!nextSteps[i].draft.screen) {
          setSaveError(`Step ${i + 1}: missing screen. Save failed.`)
          return
        }
      }

      const payloadSteps = nextSteps.map((s, idx) => {
        const isNoTap = s.draft.actionType === "no_tap"
        const target = isNoTap ? null : (s.target ?? null)

        return {
          step_index: idx + 1, // 1-based
          screen_asset_id: s.draft.screen!.screen_asset_id,
          nav_key: s.draft.nav_key,
          instruction: s.draft.instruction.trim(),
          tip: s.draft.tip.trim() ? s.draft.tip.trim() : null,
          scroll_progress: s.draft.actionType === "scroll_then_tap" ? s.draft.scrollProgress : 0,
          target_x: target ? target.x : null,
          target_y: target ? target.y : null,
          target_w: target ? target.w : null,
          target_h: target ? target.h : null,
          is_nav_target: target ? target.isNav : null,
        }
      })

      await syncTutorialSteps({ tutorial_version_id: tutorialVersionId, steps: payloadSteps })

      const { steps: rows } = await getTutorialSteps(tutorialVersionId)
      const hydrated: Step[] = rows.map((r) => {
          const hasTarget =
            r.target_x != null &&
            r.target_y != null &&
            r.target_w != null &&
            r.target_h != null

          const actionType: ActionType = !hasTarget
            ? "no_tap"
            : r.scroll_progress > 0
              ? "scroll_then_tap"
              : "direct_tap"

          const screen: ScreenAsset | null =
            r.screen_public_url && r.screen_name
              ? ({
                  screen_asset_id: r.screen_asset_id,
                  name: r.screen_name,
                  public_url: r.screen_public_url,
                } as ScreenAsset)
              : null

          return {
            id: r.tutorial_step_id,
            title: r.instruction?.trim() ? r.instruction.trim() : "(Untitled Step)",
            isSaved: true,
            target: hasTarget
              ? {
                  x: r.target_x!,
                  y: r.target_y!,
                  w: r.target_w!,
                  h: r.target_h!,
                  isNav: r.is_nav_target ?? false,
                }
              : null,
            draft: {
              instruction: r.instruction ?? "",
              tip: r.tip ?? "",
              actionType,
              scrollProgress: r.scroll_progress ?? 0,
              nav_key: r.nav_key ?? "",
              screen,
            },
          }
        })

        setSteps(hydrated)
        setActiveIndex(0)

        // load first step into the form
        if (hydrated[0]) loadStepToForm(hydrated[0])
    } catch (e: unknown) {
        setSaveError(e instanceof Error ? e.message : "Failed to delete step.  ")
    }finally {
      setSaving(false)
    }
  }

  async function saveDraftSync(): Promise<void> {
    setSaveError(null)

    if (!tutorialVersionId) {
      setSaveError("Missing tutorial version id in URL (?version=...).")
      throw new Error("Missing tutorial version id")
    }

    // Snapshot that includes current active form values
    const nextSteps = snapshotStepsWithActiveForm()

    // Validate
    for (let i = 0; i < nextSteps.length; i++) {
      const s = nextSteps[i]
      if (!s.draft.screen) {
        setSaveError(`Step ${i + 1}: Select a screen first.`)
        throw new Error("Validation failed")
      }
      if (!s.draft.nav_key) {
        setSaveError(`Step ${i + 1}: Select a navigation bar first.`)
        throw new Error("Validation failed")
      }
      if (!s.draft.instruction.trim()) {
        setSaveError(`Step ${i + 1}: Step instruction is required.`)
        throw new Error("Validation failed")
      }
      if (s.draft.actionType !== "no_tap" && !s.target) {
        setSaveError(`Step ${i + 1}: Place a tap target first (or set to "no_tap").`)
        throw new Error("Validation failed")
      }
    }

    const payloadSteps = nextSteps.map((s, idx) => {
      const isNoTap = s.draft.actionType === "no_tap"
      const target = isNoTap ? null : (s.target ?? null)

      return {
        step_index: idx + 1, // ✅ 1-based, matches your handleSaveStep()
        screen_asset_id: s.draft.screen!.screen_asset_id,
        nav_key: s.draft.nav_key,
        instruction: s.draft.instruction.trim(),
        tip: s.draft.tip.trim() ? s.draft.tip.trim() : null,
        scroll_progress: s.draft.actionType === "scroll_then_tap" ? s.draft.scrollProgress : 0,
        target_x: target ? target.x : null,
        target_y: target ? target.y : null,
        target_w: target ? target.w : null,
        target_h: target ? target.h : null,
        is_nav_target: target ? target.isNav : null,
      }
    })

    setSaving(true)
   try {
      await syncTutorialSteps({ tutorial_version_id: tutorialVersionId, steps: payloadSteps })
      setSteps((prev) => prev.map((s) => ({ ...s, isSaved: true })))
      setIsDirty(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to sync after delete."
      setSaveError(msg)
      // Optional: you can refetch steps from backend to restore truth
    } finally {
      setSaving(false)
    }
  }

  async function handleContinue() {
    try {
      await saveDraftSync()
      router.push(`/staff/tutorials/${tutorialId}/preview?version=${tutorialVersionId}`)
    } catch {
      // saveDraftSync already sets saveError
    }
  }

  async function handleDiscard() {
    const ok = window.confirm("Discard this draft? This cannot be undone.")
    if (!ok) return

    try {
      setSaving(true)
      await discardDraft({ tutorial_id: tutorialId, tutorial_version_id: tutorialVersionId })
      router.push("/staff/tutorials/library") // adjust to your actual library route
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to discard draft.")
    } finally {
      setSaving(false)
    }
  }

  function stepToUrl(step: 1 | 2 | 3) {
    if (step === 1) return `/staff/tutorials/${tutorialId}/metadata?version=${tutorialVersionId}`
    if (step === 2) return `/staff/tutorials/${tutorialId}/steps?version=${tutorialVersionId}`
    return `/staff/tutorials/${tutorialId}/preview?version=${tutorialVersionId}`
  }

  function handleTopNav(step: 1 | 2 | 3) {
    // already on steps
    if (step === 2) return

    if (isDirty) {
      setPendingNavStep(step)
      setShowUnsavedModal(true)
      return
    }

    router.push(stepToUrl(step))
  }

  
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl">
          <div className="relative">

            {showUnsavedModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5">
                  <div className="text-base font-semibold text-slate-900">
                    You have unsaved changes
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    If you continue without saving, your latest edits may be lost.
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                      onClick={() => {
                        setShowUnsavedModal(false)
                        setPendingNavStep(null)
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={async () => {
                        // Discard & Continue = refetch steps + clear dirty, then navigate
                        setShowUnsavedModal(false)
                        setIsDirty(false)

                        // IMPORTANT: use your existing "initial fetch + hydrate steps" logic here.
                        // Extract that logic into a function called `refetchAndHydrateSteps()` and call it here.
                        await refetchAndHydrateSteps()

                        const target = pendingNavStep
                        setPendingNavStep(null)
                        if (target) router.push(stepToUrl(target))
                      }}
                    >
                      Discard & Continue
                    </button>

                    <button
                      type="button"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      onClick={async () => {
                        const target = pendingNavStep
                        try {
                          await saveDraftSync()
                          setShowUnsavedModal(false)
                          setPendingNavStep(null)
                          if (target) router.push(stepToUrl(target))
                        } catch {
                          // saveDraftSync already sets saveError
                          // keep modal open so user can see error or close
                        }
                      }}
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              className={[
                "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden",
                showSaved ? "blur-sm pointer-events-none select-none" : "",
              ].join(" ")}
            >
              <TutorialBuilderSteps current={2} onStepClick={handleTopNav} />
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
                              <div key={s.id} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    persistActiveFormToStep()
                                    setActiveIndex(idx)
                                  }}
                                  className={[
                                    "group w-full rounded-2xl px-4 py-4 text-left transition relative",
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

                                  <div className="mt-1 text-[10px] font-extrabold tracking-widest opacity-80">
                                    {s.isSaved ? "SAVED" : "UNSAVED"}
                                  </div>
                                </button>

                                {/* Delete icon (top-right). Visible on hover OR when active */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteStep(s.id)
                                  }}
                                  className={[
                                    "absolute top-2 right-2 h-7 w-7 rounded-full grid place-items-center transition",
                                    isActive
                                      ? "bg-white/20 text-white hover:bg-white/30"
                                      : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600",
                                    // hide by default; show on hover for non-active
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                  ].join(" ")}
                                  title="Delete step"
                                  aria-label={`Delete step ${idx + 1}`}
                                >
                                  ✕
                                </button>
                              </div>
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
                                  onChange={(e) => {
                                    setInstruction(e.target.value)
                                    markActiveStepUnsaved()
                                    setIsDirty(true)
                                  }}
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
                                      onChange={(e) => {
                                        setActionType(e.target.value as ActionType)
                                        markActiveStepUnsaved()
                                        setIsDirty(true)
                                      }}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                                    >
                                      <option value="direct_tap">Direct Tap</option>
                                      <option value="scroll_then_tap">Scroll then Tap</option>
                                      <option value="no_tap">No Tap</option>
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
                                            onChange={(e) => {
                                              setScrollProgress(Number(e.target.value) / 100)
                                              markActiveStepUnsaved()
                                              setIsDirty(true)
                                            }}
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
                                  onChange={(e) => {
                                    setTip(e.target.value)
                                    markActiveStepUnsaved()
                                    setIsDirty(true)
                                  }}
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

                          <div className="flex items-center gap-3">
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
                        </div>
                        {/* Phone frame (click to pick / change) */}
                        <div className="mt-4 w-full flex items-center justify-center">
                          <div
                            ref={phoneFrameRef}
                            role="button"
                            tabIndex={0}
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
                              relative
                              hover:shadow-md
                              transition
                            "
                            onClick={(e) => {
                              if (!selectedScreen) {
                                setScreenPickerOpen(true)
                                return
                              }
                              if (!hasSteps) return
                              if (actionType === "no_tap") return
                              handlePlaceTapTarget(e)
                            }}
                          >
                            {selectedScreen ? (
                              <div
                                ref={contentScrollRef}
                                className={[
                                  "absolute left-0 right-0 top-0",
                                  (actionType === "direct_tap" || actionType === "no_tap")
                                    ? "overflow-hidden"
                                    : "overflow-y-auto",
                                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                                ].join(" ")}
                                style={{
                                  overscrollBehavior: "none",
                                  bottom: navbarHeight, // ✅ reserve space so bottom content isn't covered by navbar
                                }}
                                onWheel={(e) => e.preventDefault()}
                              >
                                <img
                                  src={selectedScreen.public_url}
                                  alt={selectedScreen.name}
                                  className="w-full h-auto block"
                                  draggable={false}
                                />
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                                <div className="text-2xl">📱</div>
                                <div className="mt-3 text-[10px] font-extrabold tracking-widest text-slate-900">
                                  CLICK TO CHOOSE PAGE
                                </div>
                              </div>
                            )}

                            {/* ✅ Fixed navbar overlay (must be INSIDE the phone frame container) */}
                            {selectedNavbar && (
                              <div className="absolute left-0 right-0 bottom-0 pointer-events-none">
                                <img
                                  src={selectedNavbar.public_url}
                                  alt={selectedNavbar.name}
                                  className="w-full h-auto block"
                                  draggable={false}
                                />
                              </div>
                            )}

                            {/* ✅ Tap target overlay (only in placement mode or when target exists) */}
                            {activeTarget && (
                              <div
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${activeTarget.x * 100}%`,
                                  top: `${activeTarget.y * 100}%`,
                                  width: `${activeTarget.w * 100}%`,
                                  height: `${activeTarget.h * 100}%`,
                                }}
                              >
                                <div className="w-full h-full rounded-full border-4 border-red-500 bg-red-500/10 flex items-center justify-center">
                                  <div className="text-[10px] font-extrabold tracking-widest text-red-600">
                                    TAP
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ✅ Navbar selection dropdown (below phone frame) */}
                        <div className="mt-6">
                          <label className="block text-xs font-extrabold tracking-widest text-slate-500">
                            NAVIGATION BAR
                          </label>

                          <select
                            value={selectedNavKey}
                            onChange={(e) => {
                              setSelectedNavKey(e.target.value)
                              markActiveStepUnsaved()
                              setIsDirty(true)
                            }}
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                          >
                            {/* Placeholder option if nothing loaded yet */}
                            <option value="" disabled>
                              {navbars.length > 0 ? "Select a navbar" : "Loading navbars..."}
                            </option>

                            {/* Display NAME only (as required), but store nav_key as the value */}
                            {navbars.map((n) => (
                              <option key={n.nav_bar_asset_id} value={n.nav_key}>
                                {n.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </section>
                      {/* ✅ Step save bar (below middle + right) */}
                      <section className="col-span-12 md:col-span-9 border-t border-slate-200 px-6 py-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                              🧾
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold tracking-widest text-slate-400">
                                STEP COMMITMENT
                              </div>
                              <div className="text-sm font-semibold text-slate-700">
                                {!hasSteps
                                  ? "No steps yet."
                                  : !selectedScreen
                                    ? "Waiting for screen selection..."
                                    : selectedScreen.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {saveError && (
                              <div className="mt-2 text-xs font-semibold text-red-600 px-1">
                                {saveError}
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={!hasSteps || saving}
                              className="rounded-xl bg-slate-900 px-8 py-3 text-xs font-extrabold tracking-widest text-white disabled:opacity-40"
                              onClick={handleSaveStep}
                            >
                              {saving ? "SAVING..." : `SAVE STEP ${hasSteps ? activeIndex + 1 : ""}`}
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  {/* FULL-WIDTH DIVIDER */}
                  <div className="h-px bg-slate-200" />

                  {/* Bottom action bar (flow-level) */}
                  <div className="px-10 py-6 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={handleDiscard}
                    >
                      Discard
                    </button>

                    <button
                      type="button"
                      disabled={!allStepsSaved}
                      onClick={handleContinue}
                      className="rounded-xl bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 hover:cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>

            </div>

            {showSaved && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="w-36 h-36">
                  <DotLottieReact
                    src="https://lottie.host/368a4a68-987a-487c-843f-6c1de550b21b/DB9RVXBA3B.lottie"
                    autoplay
                    loop={false}
                  />
                </div>
              </div>
            )}
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

