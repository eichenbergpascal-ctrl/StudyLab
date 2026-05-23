import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FlashcardSession } from "./_components/FlashcardSession"

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ block?: string; section?: string }>
}) {
  const { id } = await params
  const { block: blockFilter, section: sectionFilter } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!exam) notFound()

  type Flashcard = { id: string; question: string; answer: string }
  let flashcards: Flashcard[] = []

  if (sectionFilter) {
    // Section-level filter: fetch directly from flashcards for this section
    const { data } = await supabase
      .from("flashcards")
      .select("id, question, answer")
      .eq("section_id", sectionFilter)

    flashcards = data ?? []
  } else {
    let blocksQuery = supabase
      .from("blocks")
      .select(
        `
        id,
        summaries (
          sections (
            flashcards ( id, question, answer )
          )
        )
      `,
      )
      .eq("exam_id", id)

    if (blockFilter) {
      blocksQuery = blocksQuery.eq("id", blockFilter)
    }

    const { data: blocks } = await blocksQuery

    flashcards = (blocks ?? []).flatMap((block) =>
      block.summaries.flatMap((summary) =>
        summary.sections.flatMap((section) => section.flashcards),
      ),
    )
  }

  return <FlashcardSession flashcards={flashcards} examId={id} userId={user.id} />
}
