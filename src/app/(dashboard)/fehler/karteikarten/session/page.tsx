import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FlashcardErrorSession } from "./_components/FlashcardErrorSession"

export default async function FlashcardErrorSessionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Load flashcard IDs from error pool
  const { data: poolEntries } = await supabase
    .from("error_pool")
    .select("flashcard_id")
    .eq("user_id", user.id)
    .not("flashcard_id", "is", null)

  const flashcardIds = (poolEntries ?? [])
    .map((e) => e.flashcard_id)
    .filter(Boolean) as string[]

  let flashcards: { id: string; question: string; answer: string }[] = []
  if (flashcardIds.length > 0) {
    const { data } = await supabase
      .from("flashcards")
      .select("id, question, answer")
      .in("id", flashcardIds)
    flashcards = data ?? []
  }

  return <FlashcardErrorSession flashcards={flashcards} userId={user.id} />
}
