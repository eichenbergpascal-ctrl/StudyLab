import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseExamQuestion } from "@/lib/types/exam-questions"
import { ExamErrorSession } from "./_components/ExamErrorSession"

type ExamQuestionRow = {
  id: string
  section_id: string
  question_type: string
  question_data: Record<string, unknown>
  answer_data: Record<string, unknown>
  sections: {
    summaries: {
      blocks: { id: string; exam_id: string }
    }
  }
}

export default async function ExamErrorSessionPage({
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
    .select("exam_question_id")
    .eq("user_id", user.id)
    .not("exam_question_id", "is", null)

  const allIds = (poolEntries ?? [])
    .map((e) => e.exam_question_id)
    .filter(Boolean) as string[]

  if (allIds.length === 0) redirect("/fehler")

  const { data: questionsRaw } = await supabase
    .from("exam_questions")
    .select("id, section_id, question_type, question_data, answer_data, sections(summaries(blocks(id, exam_id)))")
    .in("id", allIds)

  let rows = (questionsRaw ?? []) as unknown as ExamQuestionRow[]

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = rows.map((q) => parseExamQuestion(q as any))

  return <ExamErrorSession questions={questions} userId={user.id} />
}
