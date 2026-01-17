// src/app/staff/tutorials/new/page.tsx
import TutorialMetadataForm from "./TutorialMetadataFrom"
import { getEnquiryCategories, createTutorialDraft } from "@/lib/api/tutorial"
import { redirect } from "next/navigation"

export default async function Page() {
  const categories = await getEnquiryCategories()

  async function handleCreateTutorial(payload: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
  }) {
    "use server"

    const { tutorial, draft_version } = await createTutorialDraft(payload)

    redirect(
      `/staff/tutorials/${tutorial.tutorial_id}/steps?version=${draft_version.tutorial_version_id}`
    )
  }

  return (
    <TutorialMetadataForm
      categories={categories}
      onSubmit={handleCreateTutorial}
    />
  )
}
