import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FlashcardErrorSession } from "./_components/FlashcardErrorSession"

type FlashcardRow = {
  id: string
  question: string
  answer: string
  sections: {
    summaries: {
      blocks: { id: string; exam_id: string }
    }
  }
}

export default async function FlashcardErrorSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; blockId?: string }>
}) {
  const { examId, blockId } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: poolEntries } = await supabase
    .from("error_pool")
    .select("flashcard_id")
    .eq("user_id", user.id)
    .not("flashcard_id", "is", null)

  const allIds = (poolEntries ?? [])
    .map((e) => e.flashcard_id)
    .filter(Boolean) as string[]

  if (allIds.length === 0) redirect("/fehler")

  const { data } = await supabase
    .from("flashcards")
    .select("id, question, answer, sections(summaries(blocks(id, exam_id)))")
    .in("id", allIds)

  let rows = (data ?? []) as unknown as FlashcardRow[]

  if (blockId) {
    rows = rows.filter((r) => r.sections?.summaries?.blocks?.id === blockId)
  } else if (examId) {
    rows = rows.filter((r) => r.sections?.summaries?.blocks?.exam_id === examId)
  }

  if (rows.length === 0) {
    if (blockId) redirect("/fehler?empty=block")
    else if (examId) redirect("/fehler?empty=exam")
    else redirect("/fehler")
  }

  const flashcards = rows.map((r) => ({ id: r.id, question: r.question, answer: r.answer }))

  return <FlashcardErrorSession flashcards={flashcards} userId={user.id} />
}
