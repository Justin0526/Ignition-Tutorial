import { InsightItem } from "@/types/insights"
import InsightsListItem from "./InsightsListItem"

export default function InsightsCard({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: InsightItem[]
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="rounded-t-2xl border-b border-slate-200 bg-slate-50 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900 ">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

    <div className="divide-y divide-slate-200">
        {items.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">No data yet.</div>
        ) : (
            items.slice(0, 5).map((item, idx) => (
            <InsightsListItem
                key={`${item.name}-${idx}`}
                item={item}
                rank={idx + 1}
            />
            ))
        )}
    </div>

    </section>
  )
}
