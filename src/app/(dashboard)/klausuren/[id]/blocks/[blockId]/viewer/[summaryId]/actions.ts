"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function startSectionExamSession(
  examId: string,
  sectionId: string,
): Promise<{ sessionId?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Klausur nicht gefunden." }

  const { data: questions } = await supabase
    .from("exam_questions")
    .select("id")
    .eq("section_id", sectionId)

  const questionIds = shuffle((questions ?? []).map((q) => q.id))

  if (questionIds.length === 0) {
    return { error: "Keine Aufgaben für diesen Abschnitt vorhanden." }
  }

  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      exam_id: examId,
      block_id: null,
      status: "in_progress",
      question_ids: questionIds,
      answers: {},
    })
    .select("id")
    .single()

  if (sessionError || !session) {
    return { error: "Session konnte nicht erstellt werden." }
  }

  return { sessionId: session.id }
}
