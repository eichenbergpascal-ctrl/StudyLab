import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FehlerPoolContent } from "./_components/FehlerPoolContent"
import type { FlashcardError, ExamQuestionError } from "./_components/FehlerPoolContent"

type FlashcardWithContext = {
  id: string
  question: string
  sections: {
    title: string
    summaries: {
      blocks: {
        id: string
        name: string
        exam_id: string
        exams: { id: string; name: string }
      }
    }
  }
}

type ExamQuestionWithContext = {
  id: string
  question_type: string
  question_data: Record<string, unknown>
  sections: {
    title: string
    summaries: {
      blocks: {
        id: string
        name: string
        exam_id: string
        exams: { id: string; name: string }
      }
    }
  }
}

export default async function FehlerPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>
}) {
  const { empty } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Load flashcard error entries
  const { data: flashcardPoolEntries } = await supabase
    .from("error_pool")
    .select("flashcard_id, created_at")
    .eq("user_id", user.id)
    .not("flashcard_id", "is", null)
    .order("created_at", { ascending: false })

  // Load exam question error entries
  const { data: examPoolEntries } = await supabase
    .from("error_pool")
    .select("exam_question_id, created_at")
    .eq("user_id", user.id)
    .not("exam_question_id", "is", null)
    .order("created_at", { ascending: false })

  const flashcardIds = (flashcardPoolEntries ?? [])
    .map((e) => e.flashcard_id)
    .filter(Boolean) as string[]

  const examQuestionIds = (examPoolEntries ?? [])
    .map((e) => e.exam_question_id)
    .filter(Boolean) as string[]

  let flashcardErrors: FlashcardError[] = []
  if (flashcardIds.length > 0) {
    const { data: cards } = await supabase
      .from("flashcards")
      .select("id, question, sections(title, summaries(blocks(id, name, exam_id, exams(id, name))))")
      .in("id", flashcardIds)

    const errorDateMap = new Map(
      (flashcardPoolEntries ?? []).map((e) => [e.flashcard_id, e.created_at]),
    )

    flashcardErrors = (cards ?? []).map((card) => {
      const c = card as unknown as FlashcardWithContext
      const section = c.sections
      const block = section?.summaries?.blocks
      const exam = block?.exams
      return {
        flashcard_id: c.id,
        question: c.question,
        section_title: section?.title ?? "",
        block_id: block?.id ?? "",
        block_name: block?.name ?? "",
        exam_id: exam?.id ?? "",
        exam_name: exam?.name ?? "",
        created_at: errorDateMap.get(c.id) ?? "",
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  let examErrors: ExamQuestionError[] = []
  if (examQuestionIds.length > 0) {
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("id, question_type, question_data, sections(title, summaries(blocks(id, name, exam_id, exams(id, name))))")
      .in("id", examQuestionIds)

    const errorDateMap = new Map(
      (examPoolEntries ?? []).map((e) => [e.exam_question_id, e.created_at]),
    )

    examErrors = (questions ?? []).map((q) => {
      const eq = q as unknown as ExamQuestionWithContext
      const section = eq.sections
      const block = section?.summaries?.blocks
      const exam = block?.exams
      const qd = eq.question_data
      const questionPreview =
        (qd?.question as string) ??
        (qd?.text_with_blanks as string) ??
        `Aufgabe (${eq.question_type})`
      return {
        exam_question_id: eq.id,
        question_type: eq.question_type,
        question_preview: questionPreview,
        section_title: section?.title ?? "",
        block_id: block?.id ?? "",
        block_name: block?.name ?? "",
        exam_id: exam?.id ?? "",
        exam_name: exam?.name ?? "",
        created_at: errorDateMap.get(eq.id) ?? "",
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return (
    <FehlerPoolContent
      flashcardErrors={flashcardErrors}
      examErrors={examErrors}
      emptyParam={empty}
    />
  )
}
