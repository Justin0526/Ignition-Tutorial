"use client"
import type React from "react"
import TutorialBuilderSteps from "@/components/TutorialBuilderSteps"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getTutorialSteps, type TutorialStepRow } from "@/lib/api/tutorialSteps"
import { useParams } from "next/navigation"
import { publishTutorial } from "@/lib/api/tutorial" 

export default function TutorialPreviewClient() {
    const SCROLL_DOWN_MS = 1600
    const PAUSE_BOTTOM_MS = 2000
    const SCROLL_UP_MS = 1200
    const PAUSE_TOP_MS = 600

    const searchParams = useSearchParams()
    const params = useParams<{ tutorialId: string }>()
    const tutorialId = params.tutorialId
    const tutorialVersionId = searchParams.get("version") ?? ""

    const [rows, setRows] = useState<TutorialStepRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [showShake, setShowShake] = useState(false)
    const [wrongCount, setWrongCount] = useState(0) // optional, for future feedback
    const screenViewportRef = useRef<HTMLDivElement | null>(null)
    const screenImgRef = useRef<HTMLImageElement | null>(null)
    const [screenLoadedTick, setScreenLoadedTick] = useState(0) // bump on img load
    const currentAnimRef = useRef<Animation | null>(null)
    const [isTapEnabled, setIsTapEnabled] = useState(true)

    const [publishing, setPublishing] = useState(false)
    const [publishOk, setPublishOk] = useState(false)
    const [isTipFlipped, setIsTipFlipped] = useState(false)

    // Step 1 only for now
    const activeStep = useMemo(
        () => rows[currentStepIndex] ?? null,
        [rows, currentStepIndex]
    )

    // measure phone width so we can reserve navbar space like builder
    const phoneFrameRef = useRef<HTMLDivElement | null>(null)
    const [phoneWidth, setPhoneWidth] = useState(0)

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

    const navbarHeight =
        activeStep?.nav_content_width &&
        activeStep?.nav_content_height &&
        phoneWidth > 0
            ? phoneWidth * (activeStep.nav_content_height / activeStep.nav_content_width)
            : 0

    useEffect(() => {
    if (!tutorialVersionId) return

    ;(async () => {
        try {
        setLoading(true)
        setError(null)
        const { steps } = await getTutorialSteps(tutorialVersionId)
        console.log(steps);
        setRows(steps ?? [])
        } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load steps")
        } finally {
        setLoading(false)
        }
    })()
    }, [tutorialVersionId])

    useEffect(() => {
        setCurrentStepIndex(0)
    }, [tutorialVersionId])

    useEffect(() => {
        const sp = activeStep?.scroll_progress ?? 0
        setIsTapEnabled(sp <= 0) // direct tap enabled, scroll steps disabled until bottom
    }, [activeStep?.tutorial_step_id, activeStep?.scroll_progress])

    useEffect(() => {
        setIsTipFlipped(false)
    }, [activeStep?.tutorial_step_id])

    function clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n))
    }

    function triggerShake() {
        setWrongCount((c) => c + 1)
        setShowShake(true)
        window.setTimeout(() => setShowShake(false), 350)
    }

    function isNoTapStep(step: TutorialStepRow | null) {
        if (!step) return true
        return (
            step.target_x == null ||
            step.target_y == null ||
            step.target_w == null ||
            step.target_h == null
        )
    }

    function handlePhoneTap(e: React.MouseEvent<HTMLDivElement>) {
        if (!isTapEnabled) {
            return
        }

        if (!activeStep) return

        // no_tap steps should not require hit testing
        if (isNoTapStep(activeStep)) return

        if (!phoneFrameRef.current) return
        const rect = phoneFrameRef.current.getBoundingClientRect()

        const xPx = clamp(e.clientX - rect.left, 0, rect.width)
        const yPx = clamp(e.clientY - rect.top, 0, rect.height)

        const x = xPx / rect.width
        const y = yPx / rect.height

        const tx = activeStep.target_x!
        const ty = activeStep.target_y!
        const tw = activeStep.target_w!
        const th = activeStep.target_h!

        const hit =
            x >= tx && x <= tx + tw &&
            y >= ty && y <= ty + th

        if (hit) {
            // ✅ advance
            setCurrentStepIndex((i) => Math.min(i + 1, rows.length - 1))
        } else {
            // ❌ wrong tap
            triggerShake()
        }
    }

    function hasTarget(step: TutorialStepRow | null) {
        if (!step) return false
        return (
            step.target_x != null &&
            step.target_y != null &&
            step.target_w != null &&
            step.target_h != null
        )
    }

    useEffect(() => {
        // stop any previous animation
        currentAnimRef.current?.cancel()
        currentAnimRef.current = null

        const step = activeStep
        if (!step) return

        const spRaw = step.scroll_progress ?? 0
        const sp = Math.max(0, Math.min(1, spRaw))
        if (sp <= 0) return

        const viewport = screenViewportRef.current
        const img = screenImgRef.current
        if (!viewport || !img) return

        const layer = viewport.querySelector<HTMLDivElement>("#screen-anim-layer")
        if (!layer) return

        // compute how much vertical movement is possible
        const viewportH = viewport.clientHeight
        const imgH = img.getBoundingClientRect().height
        const maxShift = Math.max(0, imgH - viewportH)

        // if nothing to scroll, do nothing
        if (maxShift <= 1) return

        // target shift based on scroll_progress
        const targetShift = maxShift * sp

        let cancelled = false

        const animateOnce = async () => {
            setIsTapEnabled(false) // ✅ disable while moving

            layer.style.transform = "translateY(0px)"
            // down
            currentAnimRef.current = layer.animate(
            [
                { transform: "translateY(0px)" },
                { transform: `translateY(${-targetShift}px)` },
            ],
            {
                duration: SCROLL_DOWN_MS,
                easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
                fill: "forwards",
            }
            )

            await currentAnimRef.current.finished.catch(() => {})
            if (cancelled) return

            setIsTapEnabled(true) // ✅ now user can tap (we're at target)
            await new Promise((r) => setTimeout(r, PAUSE_BOTTOM_MS))
            if (cancelled) return

            setIsTapEnabled(false) // leaving target region

            // up
           currentAnimRef.current = layer.animate(
            [
                { transform: `translateY(${-targetShift}px)` },
                { transform: "translateY(0px)" },
            ],
            {
                duration: SCROLL_UP_MS,
                easing: "ease-in-out",
                fill: "forwards",
            }
            )

            await currentAnimRef.current.finished.catch(() => {})
            if (cancelled) return

            await new Promise((r) => setTimeout(r, PAUSE_TOP_MS))
        }

        ;(async () => {
            while (!cancelled) {
            await animateOnce()
            }
        })()

        return () => {
            cancelled = true
            currentAnimRef.current?.cancel()
            currentAnimRef.current = null
        }
        }, [
        activeStep?.tutorial_step_id,
        activeStep?.scroll_progress,
        navbarHeight,
        screenLoadedTick,
    ])

    async function handlePublish() {
        if (!tutorialId || !tutorialVersionId) return

        try {
            setPublishing(true)
            await publishTutorial({
            tutorial_id: tutorialId,
            tutorial_version_id: tutorialVersionId,
            })
            setPublishOk(true)
        } catch (e: unknown) {
            if (e instanceof Error) {
                alert(e.message)
            } else {
                alert("Failed to publish tutorial")
            }
        } finally {
            setPublishing(false)
        }
    }

    function getCoachmarkPosition(step: TutorialStepRow) {
        // Bottom card for no-target steps
        if (!hasTarget(step)) {
            return {
            left: "50%",
            top: "78%",
            anchor: "center" as const,
            }
        }

        const cx = step.target_x! + step.target_w! / 2
        const cy = step.target_y!

        if (cx < 0.3) {
            return {
            left: `${(step.target_x! + step.target_w!) * 100}%`,
            top: `${Math.max(6, (cy - 0.12) * 100)}%`,
            anchor: "left" as const,
            }
        }

        if (cx > 0.7) {
            return {
            left: `${step.target_x! * 100}%`,
            top: `${Math.max(6, (cy - 0.12) * 100)}%`,
            anchor: "right" as const,
            }
        }

        return {
            left: `${cx * 100}%`,
            top: `${Math.max(6, (cy - 0.12) * 100)}%`,
            anchor: "center" as const,
        }
    }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        {/* ONE CONNECTED CARD */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <style jsx global>{`
                @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-6px); }
                40% { transform: translateX(6px); }
                60% { transform: translateX(-4px); }
                80% { transform: translateX(4px); }
                }
                .coachmark-3d {
                    perspective: 900px;
                }
                .coachmark-inner {
                    transform-style: preserve-3d;
                }
                .coachmark-face {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                .coachmark-back {
                    transform: rotateY(180deg);
                }

            `}</style>

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

              {activeStep && (
                <div className="mb-6 text-center">
                    <div className="text-xs font-extrabold tracking-widest text-slate-400">
                    STEP {currentStepIndex + 1} OF {rows.length}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">
                    {activeStep.instruction}
                    </div>
                </div>
            )}

              {/* Center phone frame */}
            <div className="w-full flex justify-center">
                <div className="w-full max-w-[340px]">
                    {/* Outer device shell (black frame) */}
                    <div
                        className={[
                            "rounded-[2.25rem] bg-slate-900 p-2 shadow-sm transition",
                            showShake ? "animate-[shake_0.35s_ease-in-out]" : "",
                        ].join(" ")}
                    >

                    {/* Inner screen */}
                    <div className="rounded-[2rem] bg-white ring-1 ring-slate-200 overflow-hidden">
                        <div
                            ref={phoneFrameRef}
                            onClick={handlePhoneTap}
                            className="aspect-[9/18] w-full bg-slate-50 overflow-hidden relative"
                        >

                        {/* Loading / error states */}
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                            Loading preview...
                            </div>
                        )}

                        {error && !loading && (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 px-6 text-center">
                            {error}
                            </div>
                        )}

                        {/* Screen image */}
                        {activeStep?.screen_public_url && (
                            <div
                                ref={screenViewportRef}
                                className="absolute left-0 right-0 top-0 overflow-hidden"
                                style={{ bottom: navbarHeight }}
                            >
                                <div id="screen-anim-layer" className="w-full" style={{ willChange: "transform" }}>
                                <img
                                    ref={screenImgRef}
                                    src={activeStep.screen_public_url}
                                    alt={activeStep.screen_name ?? "Screen"}
                                    className="w-full h-auto block"
                                    draggable={false}
                                    onLoad={() => setScreenLoadedTick((x) => x + 1)}
                                />
                                </div>
                            </div>
                        )}

                        {/* Tap target cue */}
                        {hasTarget(activeStep) && (
                            <div
                                className={[
                                "absolute pointer-events-none z-20",
                                !isTapEnabled ? "opacity-40" : "",
                                ].join(" ")}
                                style={{
                                left: `${activeStep!.target_x! * 100}%`,
                                top: `${activeStep!.target_y! * 100}%`,
                                width: `${activeStep!.target_w! * 100}%`,
                                height: `${activeStep!.target_h! * 100}%`,
                                }}
                            >
                                <div className="w-full h-full rounded-full border-4 border-red-500/80 bg-red-500/10 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                                </div>
                            </div>
                        )}

                        {/* Navbar overlay */}
                        {activeStep?.nav_public_url && (
                            <div className="absolute left-0 right-0 bottom-0 pointer-events-none z-10">
                            <img
                                src={activeStep.nav_public_url}
                                alt={activeStep.nav_name ?? "Navbar"}
                                className="w-full h-auto block"
                                draggable={false}
                            />
                            </div>
                        )}

                        {/* Fallback if no step */}
                        {!loading && !error && !activeStep && (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                            No steps found for this version.
                            </div>
                        )}
                        {/* Coachmark overlay (in-phone instructions) */}
                        {activeStep?.instruction && !loading && !error && (
                        <div className="absolute inset-0 z-30 pointer-events-none">
                            {/* Optional dim backdrop (very "tutorial-ish") */}
                            <div className="absolute inset-0 bg-black/25" />

                            {/* Instruction bubble */}
                            {(() => {
                            const pos = getCoachmarkPosition(activeStep)
                            return (
                                <div
                                className="absolute px-4"
                                style={{
                                    left: pos.left,
                                    top: pos.top,
                                    transform:
                                        pos.anchor === "center"
                                        ? "translate(-50%, -50%)"
                                        : pos.anchor === "left"
                                        ? "translate(0, -50%)"
                                        : "translate(-100%, -50%)",
                                    width: "90%",
                                    maxWidth: "260px",
                                }}
                                >
                                <div className="rounded-2xl bg-white/95 shadow-lg ring-1 ring-black/5 px-3 py-3">
                                    {(() => {
                                        const tipText = (activeStep.tip ?? "").trim()
                                        const hasTip = tipText.length > 0

                                        return (
                                            <div
                                            className="coachmark-3d"
                                            // IMPORTANT: allow clicking this card only
                                            style={{ pointerEvents: "auto" }}
                                            onClick={(e) => {
                                                if (!hasTip) return
                                                e.stopPropagation() // prevent triggering handlePhoneTap
                                                setIsTipFlipped((v) => !v)
                                            }}
                                            >
                                            <div
                                                className="coachmark-inner relative"
                                                style={{
                                                transition: "transform 450ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                                                transform: isTipFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                                }}
                                            >
                                                {/* FRONT: Instruction */}
                                                <div className="coachmark-face rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 p-3">
                                                <div className="text-xs font-extrabold tracking-widest text-slate-400">
                                                    STEP {currentStepIndex + 1} OF {rows.length}
                                                </div>

                                                <div className="mt-2 text-[13px] font-medium text-slate-900">
                                                    {activeStep.instruction}
                                                </div>

                                                {/* Hint only if there is a tip */}
                                                {hasTip && !isTipFlipped && (
                                                    <div className="mt-2 text-[11px] font-bold text-slate-400 text-right tracking-widest">
                                                    CLICK ME
                                                    </div>
                                                )}
                                                </div>

                                                {/* BACK: Tip */}
                                                <div className="coachmark-face coachmark-back absolute inset-0 rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 p-3">
                                                <div className="text-xs font-extrabold tracking-widest text-slate-400">
                                                    TIP
                                                </div>

                                                <div className="mt-2 text-[13px] font-medium text-slate-900">
                                                    {tipText}
                                                </div>

                                                <div className="mt-2 text-[11px] font-bold text-slate-400 text-right tracking-widest">
                                                    TAP TO GO BACK
                                                </div>
                                                </div>
                                            </div>
                                            </div>
                                        )
                                    })()}

                                </div>
                                </div>
                            )
                            })()}
                        </div>
                        )}
                        </div>

                        </div>
                    </div>
                    {activeStep && isNoTapStep(activeStep) && currentStepIndex < rows.length - 1 && (
                        <div className="mt-6 flex justify-center">
                            <button
                            type="button"
                            onClick={() => setCurrentStepIndex((i) => i + 1)}
                            className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                            Next
                            </button>
                        </div>
                    )}
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
                disabled={publishing || rows.length === 0}
                className="rounded-xl bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                onClick={handlePublish}
              >
                {publishing ? "Publishing..." : publishOk ? "Published ✓" : "Publish tutorial"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
