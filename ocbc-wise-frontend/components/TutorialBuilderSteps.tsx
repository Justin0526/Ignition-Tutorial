"use client"

const STEPS = [
  { id: 1, label: "Metadata" },
  { id: 2, label: "Steps" },
  { id: 3, label: "Preview" },
] as const

export default function TutorialBuilderSteps({
    current,
    onStepClick,
  }: {
    current: 1 | 2 | 3
    onStepClick?: (step: 1 | 2 | 3) => void
  }) {

    
  return (
    <div className="grid grid-cols-3">
      {STEPS.map((s) => {
        const isActive = s.id === current
        const isClickable = !!onStepClick && !isActive

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => isClickable && onStepClick?.(s.id)}
            disabled={!isClickable}
            className={[
              "px-6 py-4 text-center text-sm font-semibold border-b-2 w-full",
              isClickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
              isActive
                ? "text-red-600 border-red-500 bg-red-50"
                : "text-slate-500 border-transparent",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{s.id}.</span>
              <span>{s.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
