import StepsBuilderClient from "./StepsBuilderClient"
import { redirect } from "next/navigation"
import { resolveEditableVersionServer } from "@/lib/api/tutorial"

export default async function Page({
    params,
    searchParams,
  }: {
    params: Promise<{ tutorialId: string }>
    searchParams: Promise<{ version?: string; mode?: string; resolved?: string }>
  }) {
    const { tutorialId } = await params
    const sp = await searchParams

    const version = sp.version ?? ""
    const mode = (sp.mode ?? "edit") as "create" | "edit"

    const data = await resolveEditableVersionServer(tutorialId)
    const resolvedVersionId = data.tutorial_version_id

    if (resolvedVersionId && resolvedVersionId !== version) {
      const action = data.action ?? "resolved"
      redirect(
        `/staff/tutorials/${tutorialId}/steps?version=${resolvedVersionId}&mode=${mode}&resolved=${action}`
      )
    }

    return <StepsBuilderClient />
}
