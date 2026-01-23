// src/app/staff/tutorials/new/page.tsx
import TutorialMetadataForm from "./TutorialMetadataForm"
import { getEnquiryCategories, createTutorialDraft } from "@/lib/api/tutorial"
import { ApiError } from "@/lib/api/fetchJson" // adjust path
import { redirect } from "next/navigation"

function hasTutorialExistsBody(x: unknown): x is { code: string; tutorial_id: string } {
    return (
      typeof x === "object" &&
      x !== null &&
      "code" in x &&
      "tutorial_id" in x &&
      typeof (x as Record<string, unknown>).code === "string" &&
      typeof (x as Record<string, unknown>).tutorial_id === "string"
    )
  }

export default async function Page() {
  const categories = await getEnquiryCategories()

  async function handleCreateTutorial(payload: {
    name: string
    enquiry_category_id: string
    estimated_time_sec?: number
  }) {
    "use server"
    try {
      console.log("Hello");  
      const { tutorial, draft_version } = await createTutorialDraft(payload)
        console.log("Hello");
        redirect(
          `/staff/tutorials/${tutorial.tutorial_id}/steps?version=${draft_version.tutorial_version_id}`
        )
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 409 && hasTutorialExistsBody(e.body) && e.body.code === "TUTORIAL_EXISTS") {
          redirect(`/staff/tutorials/${e.body.tutorial_id}/metadata`)
        }
        throw new Error(e.message)
      }

      throw new Error("Failed to create tutorial")
    }
  }

  return (
    <TutorialMetadataForm
      categories={categories}
      onSubmit={handleCreateTutorial}
    />
  )
}
