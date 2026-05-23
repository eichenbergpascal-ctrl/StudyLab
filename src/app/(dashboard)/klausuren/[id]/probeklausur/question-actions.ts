"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createExamQuestion(
  examId: string,
  sectionId: string,
  questionType: string,
  questionData: Record<string, unknown>,
  answerData: Record<string, unknown>,
): Promise<{ error?: string }> {
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

  const { error } = await supabase.from("exam_questions").insert({
    section_id: sectionId,
    question_type: questionType,
    question_data: questionData,
    answer_data: answerData,
    is_user_created: true,
  })
  if (error) return { error: "Aufgabe konnte nicht erstellt werden." }

  revalidatePath(`/klausuren/${examId}/probeklausur`)
  return {}
}

export async function updateExamQuestion(
  examId: string,
  questionId: string,
  questionType: string,
  questionData: Record<string, unknown>,
  answerData: Record<string, unknown>,
): Promise<{ error?: string }> {
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

  const { error } = await supabase
    .from("exam_questions")
    .update({
      question_type: questionType,
      question_data: questionData,
      answer_data: answerData,
    })
    .eq("id", questionId)
  if (error) return { error: "Aufgabe konnte nicht aktualisiert werden." }

  revalidatePath(`/klausuren/${examId}/probeklausur`)
  return {}
}

export async function deleteExamQuestion(
  examId: string,
  questionId: string,
): Promise<{ error?: string }> {
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

  const { error } = await supabase
    .from("exam_questions")
    .delete()
    .eq("id", questionId)
  if (error) return { error: "Aufgabe konnte nicht gelöscht werden." }

  revalidatePath(`/klausuren/${examId}/probeklausur`)
  return {}
}
