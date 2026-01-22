import { redirect } from "next/navigation"
import TutorialMetadataClient from "./TutorialMetadataClient"
import {
  getEnquiryCategories,
  getTutorialMeta,
  resolveEditableVersionServer,
} from "@/lib/api/tutorial"

export default async function Page({
    params,
    searchParams,
    }: {
    params: Promise<{ tutorialId: string }>
    searchParams: Promise<{ version?: string; mode?: string }>
    }) {
    const { tutorialId } = await params
    const sp = await searchParams

    // keep consistent with your builder routes
    const mode = (sp.mode ?? "edit") as "create" | "edit"
    let version = sp.version ?? ""

    // Ensure we always have a draft version id to carry around in the URL
    if (!version) {
        const r = await resolveEditableVersionServer(tutorialId)
        version = r.tutorial_version_id
        redirect(`/staff/tutorials/${tutorialId}/metadata?version=${version}&mode=${mode}&resolved=${r.action ?? "resolved"}`)
    }

    const [categories, meta] = await Promise.all([
        getEnquiryCategories(),
        getTutorialMeta(tutorialId), // backend GET meta you already built
    ])

    console.log(categories);
    console.log(meta);

    return (
        <TutorialMetadataClient
        tutorialId={tutorialId}
        tutorialVersionId={version}
        mode={mode}
        categories={categories}
        initialMeta={meta}
        />
    )
}
