"use client"

const STEPS = [
  { id: 1, label: "Metadata" },
  { id: 2, label: "Steps" },
  { id: 3, label: "Preview" },
] as const

export default function TutorialBuilderSteps({
  current,
}: {
  current: 1 | 2 | 3
}) {
  return (
    <div className="grid grid-cols-3">
      {STEPS.map((s) => {
        const isActive = s.id === current

        return (
          <div
            key={s.id}
            className={[
              "px-6 py-4 text-center text-sm font-semibold",
              "border-b-2",
              isActive
                ? "text-red-600 border-red-500 bg-red-50"
                : "text-slate-500 border-transparent",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{s.id}.</span>
              <span>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
