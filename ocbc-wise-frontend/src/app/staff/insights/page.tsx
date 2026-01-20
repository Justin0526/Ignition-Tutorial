import InsightsCard from "@/components/InsightsCard"
import ContinuousImprovement from "@/components/ContinuousImprovement"
import { getTopFrequentlyAsked, getTopMostEscalated } from "@/lib/api/staffInsights"

export default async function InsightsPage() {
  const [frequent, escalated] = await Promise.all([
    getTopFrequentlyAsked(),
    getTopMostEscalated(),
  ])

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Knowledge Insights</h1>
        <p className="mt-2 text-slate-500">
          Identify high-friction customer journeys and build tutorials to reduce support volume.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InsightsCard
          title="Top Frequently Asked"
          subtitle="Highest volume of support enquiries this month"
          items={frequent}
        />
        <InsightsCard
          title="Top Most Escalated"
          subtitle="Enquiries most likely to require a human agent"
          items={escalated}
        />
      </div>

      <ContinuousImprovement />
    </div>
  )
}
