import { InsightItem } from "@/types/insights"

export default function InsightsListItem({
  item,
  rank,
}: {
  item: InsightItem
  rank: number
}) {
  return (
    <div
        className="
            group flex w-full items-center justify-between gap-4
            px-6 py-4 transition
            hover:bg-slate-50
        "
    >

      {/* LEFT CONTENT */}
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-600">
          {rank}
        </div>

        {/* Text */}
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {item.name}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {item.enquiries} enquiries
            {item.escalationRate !== undefined && (
            <>
                {" · "}
                <span
                className={
                    item.escalationRate > 0.5
                    ? "text-red-600 font-medium"
                    : ""
                }
                >
                {(item.escalationRate * 100).toFixed(0)}% escalation rate
                </span>
            </>
            )}
        </div>
        </div>
      </div>

      {/* RIGHT ACTION (hidden until hover) */}
      <button
        className="
          hidden cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white
          group-hover:block
          hover:bg-red-500
        "
      >
        Create Tutorial
      </button>
    </div>
  )
}
