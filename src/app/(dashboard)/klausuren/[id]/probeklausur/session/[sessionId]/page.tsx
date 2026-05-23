import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { parseExamQuestion } from "@/lib/types/exam-questions"
import type { SessionAnswers } from "@/lib/types/exam-questions"
import { ExamSession } from "./_components/ExamSession"

export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const { id: examId, sessionId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Load session and verify ownership
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, block_id, status, question_ids, answers, user_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (!session) notFound()

  // Redirect completed sessions back to overview
  if (session.status === "completed") {
    redirect(`/klausuren/${examId}/probeklausur`)
  }

  const questionIds = session.question_ids as string[]
  if (!questionIds || questionIds.length === 0) {
    redirect(`/klausuren/${examId}/probeklausur`)
  }

  // Load all questions in the session
  const { data: questionsRaw } = await supabase
    .from("exam_questions")
    .select("id, section_id, question_type, question_data, answer_data")
    .in("id", questionIds)

  if (!questionsRaw || questionsRaw.length === 0) notFound()

  // Maintain order defined by question_ids
  const questionsMap = new Map(questionsRaw.map((q) => [q.id, q]))
  const questions = questionIds
    .map((qid) => questionsMap.get(qid))
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((q) => parseExamQuestion(q as any))

  // Load block name if Teilklausur
  let blockName: string | undefined
  if (session.block_id) {
    const { data: block } = await supabase
      .from("blocks")
      .select("name")
      .eq("id", session.block_id)
      .single()
    blockName = block?.name
  }

  const initialAnswers = (session.answers ?? {}) as SessionAnswers

  return (
    <ExamSession
      questions={questions}
      sessionId={sessionId}
      examId={examId}
      userId={user.id}
      initialAnswers={initialAnswers}
      blockName={blockName}
    />
  )
}
