import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseExamQuestion } from "@/lib/types/exam-questions"
import { ExamErrorSession } from "./_components/ExamErrorSession"

export default async function ExamErrorSessionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Load exam question IDs from error pool
  const { data: poolEntries } = await supabase
    .from("error_pool")
    .select("exam_question_id")
    .eq("user_id", user.id)
    .not("exam_question_id", "is", null)

  const examQuestionIds = (poolEntries ?? [])
    .map((e) => e.exam_question_id)
    .filter(Boolean) as string[]

  if (examQuestionIds.length === 0) {
    redirect("/fehler")
  }

  const { data: questionsRaw } = await supabase
    .from("exam_questions")
    .select("id, section_id, question_type, question_data, answer_data")
    .in("id", examQuestionIds)

  const questions = (questionsRaw ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((q) => parseExamQuestion(q as any))

  return <ExamErrorSession questions={questions} userId={user.id} />
}
